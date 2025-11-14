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
let isCreating = false;
let currentToken: string | null = null;

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

  const token = accessToken || tokenStorage.get();

  // Create or recreate client if token changed (should be rare - only on login/logout)
  // Use a flag to prevent concurrent creation
  if ((!clientInstance || currentToken !== token) && !isCreating) {
    isCreating = true;
    try {
      clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          // Disable Supabase auth since we use our own auth system
          autoRefreshToken: false,
          persistSession: false,
          // Use a unique storage key to avoid conflicts with other Supabase instances
          storageKey: 'sb-storage-only',
        },
        global: {
          // Set headers in global config so they're used by storage operations
          headers: token ? {
            Authorization: `Bearer ${token}`,
          } : {},
        },
      });
      currentToken = token;
    } finally {
      isCreating = false;
    }
  }

  // Wait for client to be created if it's being created concurrently
  if (!clientInstance && isCreating) {
    // In case of concurrent calls, wait a bit and retry
    // This is a fallback - the singleton pattern should prevent this
    return null;
  }

  // Update headers if client exists and token is the same (ensure they're set)
  if (token && clientInstance && currentToken === token) {
    // Update the client's default headers as well
    if (clientInstance.rest && clientInstance.rest.headers) {
      clientInstance.rest.headers['Authorization'] = `Bearer ${token}`;
    }
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
    if (clientInstance.rest && clientInstance.rest.headers) {
      delete clientInstance.rest.headers['Authorization'];
    }
  }
  // Reset client instance and token to allow recreation with new token
  clientInstance = null;
  currentToken = null;
};

/**
 * Default Supabase client (singleton)
 * Returns the same client instance
 */
export const supabaseClient = (): SupabaseClient | null => {
  return createSupabaseClient();
};

