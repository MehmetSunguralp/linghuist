import type { User } from './UserTypes';

export const FriendRequestStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
} as const;

export type FriendRequestStatus =
  (typeof FriendRequestStatus)[keyof typeof FriendRequestStatus];

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: Date;
  sender?: User;
  receiver?: User;
}
