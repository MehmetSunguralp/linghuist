import type { User } from './UserTypes';
import type { Chat } from './ChatTypes';

export const MessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  VOICE: 'VOICE',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content?: string | null;
  mediaUrl?: string | null;
  createdAt: Date;
  sender?: User;
  receiver?: User;
  read: boolean;
  chatId: string;
  chat?: Chat;
  edited?: boolean;
  deleted?: boolean;
  correctedBy?: string;
  correction?: string;
  originalContent?: string | null;
}
