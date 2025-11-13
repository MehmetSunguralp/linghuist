import { User } from './UserTypes';
import { Chat } from './ChatTypes';

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
}

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
}

