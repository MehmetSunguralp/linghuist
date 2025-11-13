import { User } from './UserTypes';
import { Post } from './PostTypes';

export interface Like {
  id: string;
  postId: string;
  post?: Post;
  userId: string;
  user?: User;
  createdAt: Date;
}

