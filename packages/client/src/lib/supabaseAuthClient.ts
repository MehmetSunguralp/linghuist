/**
 * Supabase Auth Client for password reset operations
 * 
 * This is a separate client instance specifically for auth operations
 * that require Supabase's built-in auth handling (like password reset with tokens).
 * 
 * The main supabaseClient is configured to not use auth, but for password reset
 * we need Supabase's auth system to handle the recovery tokens from email links.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are not set. Password reset may not work.',
  );
}

let authClientInstance: SupabaseClient | null = null;

/**
 * Gets a Supabase client instance configured for auth operations
 * This is used specifically for password reset flows that require
 * Supabase's auth token handling from URL hash fragments
 */
export const getSupabaseAuthClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!authClientInstance) {
    authClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Don't persist session, just use it for password reset
        detectSessionInUrl: true, // Detect session from URL hash fragments
      },
    });
  }

  return authClientInstance;
};

