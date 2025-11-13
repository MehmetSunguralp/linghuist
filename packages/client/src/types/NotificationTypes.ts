import type { User } from './UserTypes';
import type { Post } from './PostTypes';
import type { Comment } from './CommentTypes';

export const NotificationType = {
  LIKE: 'LIKE',
  COMMENT: 'COMMENT',
  FOLLOW: 'FOLLOW',
  MESSAGE: 'MESSAGE',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  recipientId: string;
  recipient?: User;
  actorId: string;
  actor?: User;
  postId?: string | null;
  post?: Post | null;
  commentId?: string | null;
  comment?: Comment | null;
  read: boolean;
  createdAt: Date;
}
