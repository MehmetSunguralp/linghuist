/**
 * Supabase Client for frontend
 * 
 * This client is used for Supabase Storage operations only.
 * Auth operations are handled by the backend GraphQL API.
 * 
 * Uses a SINGLE client instance to avoid "Multiple GoTrueClient instances" warning.
 * Authentication is handled via headers, not through Supabase's auth system.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { tokenStorage } from '@/utils/tokenStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are not set. Some features may not work.',
  );
}

// SINGLE client instance for the entire app
// We don't use Supabase auth, so we can use one client and pass tokens via headers
let clientInstance: SupabaseClient | null = null;

/**
 * Gets the single Supabase client instance
 * Authentication is handled via headers when making requests
 * @param accessToken - Optional access token for the current request
 * @returns Supabase client instance or null if configuration is missing
 */
export const createSupabaseClient = (
  accessToken?: string | null,
): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // Create single client instance if it doesn't exist
  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Disable Supabase auth since we use our own auth system
        autoRefreshToken: false,
        persistSession: false,
        // Use a unique storage key to avoid conflicts with other Supabase instances
        storageKey: 'sb-storage-only',
      },
      global: {
        // Default headers - will be overridden per-request if needed
        headers: {},
      },
    });
  }

  // Update headers for this client instance with the current token
  // Note: This affects all future requests, but since we're using signed URLs
  // which are generated server-side, this should be fine
  const token = accessToken || tokenStorage.get();
  if (token && clientInstance) {
    // Update the client's default headers
    clientInstance.rest.headers['Authorization'] = `Bearer ${token}`;
  }

  return clientInstance;
};

/**
 * Clears the client instance (useful for logout)
 * Call this when the user logs out
 */
export const clearSupabaseClientCache = (): void => {
  if (clientInstance) {
    // Remove auth header
    delete clientInstance.rest.headers['Authorization'];
  }
};

/**
 * Default Supabase client (singleton)
 * Returns the same client instance
 */
export const supabaseClient = (): SupabaseClient | null => {
  return createSupabaseClient();
};

export default supabaseClient();

