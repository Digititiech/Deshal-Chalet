/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';
import { DEFAULT_PROFILES, localDB } from '../services/db';

// -------------------------------------------------------
// Auth Session Types
// -------------------------------------------------------
export interface AuthSession {
  user: {
    id: string;
    email: string;
  } | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthSession {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<{ error: string | null }>;
}

// -------------------------------------------------------
// Context
// -------------------------------------------------------
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// -------------------------------------------------------
// Local Auth (Fallback when Supabase is not configured)
// -------------------------------------------------------
const LOCAL_AUTH_KEY = 'tsc_local_auth';

function getLocalAuthUser(): { id: string; email: string } | null {
  try {
    const val = localStorage.getItem(LOCAL_AUTH_KEY);
    if (val) return JSON.parse(val);
  } catch {}
  return null;
}

function setLocalAuthUser(user: { id: string; email: string } | null) {
  if (user) {
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LOCAL_AUTH_KEY);
  }
}

// -------------------------------------------------------
// Provider
// -------------------------------------------------------
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile from profiles list by user id
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('profiles')
        .select('*, user_properties(property_id)')
        .eq('id', userId)
        .single();
      if (data) {
        return {
          ...data,
          assigned_property_ids: data.user_properties?.map((up: any) => up.property_id) || []
        } as Profile;
      }
    }
    // Fallback: find in local profiles
    const profiles = localDB.getProfiles();
    return profiles.find(p => p.id === userId) || null;
  };

  // Initialize auth state on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      if (isSupabaseConfigured && supabase) {
        // 1. Get existing Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser = { id: session.user.id, email: session.user.email! };
          setUser(authUser);
          const p = await loadProfile(session.user.id);
          setProfile(p);
        }

        // 2. Subscribe to auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const authUser = { id: session.user.id, email: session.user.email! };
            setUser(authUser);
            const p = await loadProfile(session.user.id);
            setProfile(p);
          } else {
            setUser(null);
            setProfile(null);
          }
          setIsLoading(false);
        });

        setIsLoading(false);
        return () => subscription.unsubscribe();
      } else {
        // Local fallback auth
        const localUser = getLocalAuthUser();
        if (localUser) {
          setUser(localUser);
          const p = await loadProfile(localUser.id);
          setProfile(p);
        }
        setIsLoading(false);
      }
    };

    init();
  }, []);

  // -------------------------------------------------------
  // signIn
  // -------------------------------------------------------
  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { error: translateAuthError(error.message) };
      }
      if (data.user) {
        const authUser = { id: data.user.id, email: data.user.email! };
        setUser(authUser);
        const p = await loadProfile(data.user.id);
        setProfile(p);
        // Update last_login_at
        await supabase.from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }
      return { error: null };
    }

    // Local Auth Fallback — check against DEFAULT_PROFILES passwords
    const profiles = localDB.getProfiles();
    const match = profiles.find(
      p => p.email.toLowerCase() === email.toLowerCase() && p.password === password
    );
    if (!match) {
      return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.' };
    }
    if (match.status === 'inactive') {
      return { error: 'حسابك معطّل. يرجى التواصل مع المدير.' };
    }

    const authUser = { id: match.id, email: match.email };
    setUser(authUser);
    setProfile(match);
    setLocalAuthUser(authUser);

    // Sync simulated user
    const { setCurrentlySimulatedUser } = await import('../services/db');
    setCurrentlySimulatedUser(match);

    return { error: null };
  };

  // -------------------------------------------------------
  // signOut
  // -------------------------------------------------------
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setLocalAuthUser(null);
    localStorage.removeItem('tsc_current_sim_user');
  };

  // -------------------------------------------------------
  // sendPasswordResetEmail
  // -------------------------------------------------------
  const sendPasswordResetEmail = async (email: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        return { error: translateAuthError(error.message) };
      }
      return { error: null };
    }

    // Offline fallback: just verify the email exists
    const profiles = localDB.getProfiles();
    const match = profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
    if (!match) {
      // Do NOT reveal whether email exists — return success regardless
    }
    return { error: null };
  };

  const value: AuthContextValue = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    sendPasswordResetEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// -------------------------------------------------------
// Helper: Translate Supabase error messages to Arabic
// -------------------------------------------------------
function translateAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials')) {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى المحاولة مجدداً.';
  }
  if (lower.includes('email not confirmed')) {
    return 'لم يتم التحقق من بريدك الإلكتروني بعد. يرجى التواصل مع المدير.';
  }
  if (lower.includes('too many requests')) {
    return 'تم تجاوز الحد المسموح من المحاولات. يرجى الانتظار قليلاً ثم المحاولة مجدداً.';
  }
  if (lower.includes('user not found') || lower.includes('user_not_found')) {
    return 'البريد الإلكتروني غير مسجّل في النظام.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'تعذّر الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.';
  }
  return 'حدث خطأ غير متوقع. يرجى المحاولة مجدداً.';
}
