export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export interface Language {
  id: string;
  name: string;
  level: string;
  code: string;
}

export interface User {
  id: string;
  username?: string | null;
  name?: string | null;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  bio?: string | null;
  country?: string | null;
  age?: number | null;
  languagesKnown?: Language[];
  languagesLearn?: Language[];
  isOnline: boolean;
  lastOnline?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
}

export interface UserLanguage {
  id: string;
  name: string;
  level: string;
  code: string;
}

