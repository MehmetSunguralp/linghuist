// NotificationTypes.ts - Notification related types

import { NotificationType } from './CommonTypes';
import { User } from './UserTypes';
import { Post } from './PostTypes';
import { Comment } from './PostTypes';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  recipientId: string;
  actorId: string;
  postId?: string;
  commentId?: string;
  read: boolean;
  createdAt: string;
  recipient?: Partial<User>;
  actor?: Partial<User>;
  post?: Partial<Post>;
  comment?: Partial<Comment>;
}

