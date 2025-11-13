import { User } from './UserTypes';
import { Post } from './PostTypes';
import { Comment } from './CommentTypes';

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MESSAGE = 'MESSAGE',
}

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

