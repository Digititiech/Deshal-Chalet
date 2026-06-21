/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// VITE_ env vars are injected at build time by Vite.
// Fallback values are used when the build system (e.g. Vercel) does not inject them.
// The anon key is intentionally public — it is the Supabase publishable key
// and all data access is enforced by Row Level Security (RLS) policies.
const supabaseUrl =
  ((import.meta as any).env.VITE_SUPABASE_URL as string) ||
  'https://bqjqfaaymiovusiftzxn.supabase.co';

const supabaseAnonKey =
  ((import.meta as any).env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxanFmYWF5bWlvdnVzaWZ0enhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzA2MDUsImV4cCI6MjA5NzU0NjYwNX0.YtgVI-_YP4eFmTSdbS5JMxqxmoEZOOS0Erlj5tcpczY';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
