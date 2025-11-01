// FriendRequestTypes.ts - FriendRequest related types

import { FriendRequestStatus } from './CommonTypes';
import { User } from './UserTypes';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  sender?: Partial<User>;
  receiver?: Partial<User>;
}

