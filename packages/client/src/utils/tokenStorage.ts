/**
 * Token storage utility
 * 
 * This abstraction allows us to easily switch between storage mechanisms
 * (localStorage, sessionStorage, httpOnly cookies, in-memory, etc.)
 * 
 * Current implementation uses localStorage (see security note in AuthTypes.ts)
 */

const TOKEN_KEY = 'access_token';

export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
  },

  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
  },

  exists: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

/**
 * Future implementation example for httpOnly cookies:
 * 
 * export const tokenStorage = {
 *   get: (): string | null => {
 *     // Token is in httpOnly cookie, not accessible via JS
 *     // Server should read it from cookie header
 *     return null;
 *   },
 *   set: async (token: string): Promise<void> => {
 *     // Call API endpoint to set httpOnly cookie
 *     await fetch('/api/auth/set-token', {
 *       method: 'POST',
 *       headers: { 'Content-Type': 'application/json' },
 *       body: JSON.stringify({ token }),
 *       credentials: 'include',
 *     });
 *   },
 *   remove: async (): Promise<void> => {
 *     await fetch('/api/auth/remove-token', {
 *       method: 'POST',
 *       credentials: 'include',
 *     });
 *   },
 * };
 */

