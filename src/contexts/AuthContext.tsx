/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Profile } from '../types';
import { DEFAULT_PROFILES, localDB, DatabaseService } from '../services/db';

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
  isRecoveryMode: boolean;
  setIsRecoveryMode: (val: boolean) => void;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  authError: string | null;
  clearAuthError: () => void;
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
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

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
    let cleanupFn: (() => void) | undefined;

    const init = async () => {
      setIsLoading(true);

      const hashStr = window.location.hash;
      const searchStr = window.location.search;

      // Handle expired/invalid OTP link from Supabase email
      // URL looks like: #error=access_denied&error_code=otp_expired&error_description=...
      if (hashStr.includes('error=access_denied') || hashStr.includes('error_code=otp_expired')) {
        // Clear the ugly error hash from the URL bar
        if (window.history.replaceState) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setAuthError('انتهت صلاحية رابط إعادة تعيين كلمة المرور. يرجى طلب رابط جديد.');
        setIsLoading(false);
        return;
      }

      // Detect password recovery mode from URL hash FIRST before anything else
      // Supabase v2 PKCE flow sends: ?code=<auth_code> to the redirectTo URL
      // Supabase implicit flow sends: #access_token=...&type=recovery
      const searchParams = new URLSearchParams(searchStr);
      const pkceCode = searchParams.get('code');
      const isOnResetPath = window.location.pathname.includes('/reset-password');

      const isRecovery =
        hashStr.includes('type=recovery') ||
        searchStr.includes('type=recovery') ||
        (isOnResetPath && !!pkceCode);

      if (isRecovery) {
        setIsRecoveryMode(true);
      }

      // PKCE flow: exchange the auth code for a session.
      // This will trigger the PASSWORD_RECOVERY event in onAuthStateChange.
      if (pkceCode && isSupabaseConfigured && supabase) {
        supabase.auth.exchangeCodeForSession(pkceCode).then(({ error }) => {
          if (error) {
            console.error('[Auth] PKCE code exchange failed:', error.message);
            // Show user-friendly error for expired/invalid links
            if (error.message.toLowerCase().includes('expired') ||
                error.message.toLowerCase().includes('invalid') ||
                error.message.toLowerCase().includes('code')) {
              setAuthError('انتهت صلاحية رابط إعادة تعيين كلمة المرور أو أنه غير صالح. يرجى طلب رابط جديد.');
            } else {
              setAuthError(translateAuthError(error.message));
            }
            setIsLoading(false);
          }
          // On success, onAuthStateChange will fire PASSWORD_RECOVERY event
          // which sets isRecoveryMode = true and isLoading = false
        });
        // Clean the ?code= from URL bar so it can't be replayed
        if (window.history.replaceState) {
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }

      if (isSupabaseConfigured && supabase) {
        // Subscribe to auth state changes BEFORE getting session
        // This ensures PASSWORD_RECOVERY event is captured correctly
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            // Recovery event: show reset-password form, do NOT set user session
            setIsRecoveryMode(true);
            setIsLoading(false);
            return;
          }

          if (event === 'SIGNED_IN' && (isRecovery || window.location.hash.includes('type=recovery'))) {
            // SIGNED_IN fires alongside PASSWORD_RECOVERY — ignore it in recovery mode
            setIsLoading(false);
            return;
          }

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

        cleanupFn = () => subscription.unsubscribe();

        // 1. Get existing Supabase session (only use it if NOT in recovery mode)
        if (!isRecovery) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const authUser = { id: session.user.id, email: session.user.email! };
            setUser(authUser);
            const p = await loadProfile(session.user.id);
            setProfile(p);
          }
        }

        setIsLoading(false);
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
    return () => { if (cleanupFn) cleanupFn(); };
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
        redirectTo: 'https://reset-chalet.aldleelalshamel.com/reset-password',
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

  // -------------------------------------------------------
  // updatePassword
  // -------------------------------------------------------
  const updatePassword = async (password: string): Promise<{ error: string | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        return { error: translateAuthError(error.message) };
      }
      return { error: null };
    }

    // Offline mode: update the current simulated user's password
    if (profile) {
      try {
        await DatabaseService.updateProfile({
          ...profile,
          password: password,
        });
        return { error: null };
      } catch (err: any) {
        return { error: err.message || 'تعذر تحديث كلمة المرور في قاعدة البيانات المحلية.' };
      }
    }
    return { error: 'تعذر تحديث كلمة المرور لعدم وجود مستخدم نشط.' };
  };

  const value: AuthContextValue = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signOut,
    sendPasswordResetEmail,
    isRecoveryMode,
    setIsRecoveryMode,
    updatePassword,
    authError,
    clearAuthError,
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
