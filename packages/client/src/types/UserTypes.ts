// UserTypes.ts - User related types

import { Role, Language } from './CommonTypes';

export interface User {
  id: string;
  username?: string;
  name?: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  bio?: string;
  country?: string;
  age?: number;
  languagesKnown?: Language[];
  languagesLearn?: Language[];
  isOnline: boolean;
  lastOnline?: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
}

// Profile-specific types (used in profile pages)
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
  country?: string | null;
  age?: number | null;
  role?: Role;
  languagesKnown?: Language[];
  languagesLearn?: Language[];
}

