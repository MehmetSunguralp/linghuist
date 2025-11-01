// ComponentTypes.ts - Component-specific prop types

import { Language } from './CommonTypes';

// UserCard component props
export interface UserCardProps {
  id: string;
  name?: string | null;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
  country?: string | null;
  age?: number | null;
  languagesKnown?: Language[];
  languagesLearn?: Language[];
}

// ImageUpload component props
export interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  bucket?: string;
  folder?: string;
  userId: string;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

