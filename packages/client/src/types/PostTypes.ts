import { User } from './UserTypes';
import { Comment } from './CommentTypes';
import { Like } from './LikeTypes';

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

