import type { User } from './UserTypes';

export interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  signedAvatarUrl: string | null;
  signedAvatarUrlExpiry: number | null; // Timestamp when the signed URL expires
}

export interface AuthUser {
  id: string;
  email: string;
  avatarUrl?: string | null;
  username?: string | null;
}

/**
 * Security Note: Storing access tokens in localStorage
 *
 * ⚠️ localStorage is vulnerable to XSS attacks. If your app is compromised by XSS,
 * malicious scripts can access localStorage and steal tokens.
 *
 * Better alternatives:
 * 1. httpOnly cookies (most secure, prevents XSS access)
 * 2. Secure, httpOnly cookies with SameSite=Strict
 * 3. In-memory storage (cleared on page refresh, but more secure)
 * 4. SessionStorage (cleared on tab close, still vulnerable to XSS)
 *
 * For production, consider:
 * - Using httpOnly cookies set by the server
 * - Implementing refresh token rotation
 * - Using short-lived access tokens (15-30 minutes)
 * - Storing refresh tokens in httpOnly cookies
 */
