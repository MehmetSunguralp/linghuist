// CommonTypes.ts - Shared enums and base types

export type Role = 'USER' | 'ADMIN' | 'MODERATOR';
export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MESSAGE';
export type MessageType = 'TEXT' | 'IMAGE' | 'VOICE';
export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

// Language type (shared by User and Post domains)
export interface Language {
  id: string;
  name: string;
  level: string;
  code: string;
}

// Language input type (for forms - without id)
export interface LanguageInput {
  name: string;
  level: string;
  code: string;
}
