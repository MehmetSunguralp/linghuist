// ChatTypes.ts - Chat, Message, and ChatParticipant types

import { MessageType } from './CommonTypes';
import { User } from './UserTypes';

export interface Chat {
  id: string;
  participants?: ChatParticipant[];
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  user?: Partial<User>;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  createdAt: string;
  read: boolean;
  chatId: string;
  sender?: Partial<User>;
  receiver?: Partial<User>;
}

