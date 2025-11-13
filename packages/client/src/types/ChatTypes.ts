import type { User } from './UserTypes';
import type { Message } from './MessageTypes';

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  user?: User;
}

export interface Chat {
  id: string;
  participants?: ChatParticipant[];
  messages?: Message[];
  createdAt: Date;
  updatedAt: Date;
}
