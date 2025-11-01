// PostTypes.ts - Post, Comment, Like types

import { User } from './UserTypes';

export interface Post {
  id: string;
  authorId: string;
  author?: Partial<User>;
  content: string;
  imageUrl?: string;
  allowComments: boolean;
  likes?: Like[];
  comments?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: Partial<User>;
  content: string;
  createdAt: string;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

