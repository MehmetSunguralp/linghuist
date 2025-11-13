import type { User } from './UserTypes';
import type { Comment } from './CommentTypes';
import type { Like } from './LikeTypes';

export interface Post {
  id: string;
  authorId: string;
  author?: User;
  content: string;
  imageUrl?: string | null;
  allowComments: boolean;
  likes?: Like[];
  comments?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
