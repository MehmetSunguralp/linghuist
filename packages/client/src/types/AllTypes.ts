// AllTypes.ts - Central export file for all types
// Re-exports from modular type files for convenience

// Common types
export type {
  Role,
  NotificationType,
  MessageType,
  FriendRequestStatus,
  Language,
  LanguageInput,
} from './CommonTypes';

// User types
export type { User, UserProfile } from './UserTypes';

// Post types
export type { Post, Comment, Like } from './PostTypes';

// Chat types
export type { Chat, ChatParticipant, Message } from './ChatTypes';

// Notification types
export type { Notification } from './NotificationTypes';

// FriendRequest types
export type { FriendRequest } from './FriendRequestTypes';

// Auth types
export type { SignupInput, LoginInput, AuthResponse } from './AuthTypes';

// Component types
export type { UserCardProps, ImageUploadProps } from './ComponentTypes';
