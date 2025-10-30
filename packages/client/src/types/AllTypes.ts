// types.ts — shared client types (based on Prisma schema)

export type Role = 'USER' | 'ADMIN' | 'MODERATOR';
export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MESSAGE';
export type MessageType = 'TEXT' | 'IMAGE' | 'VOICE';
export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Language {
  id: string;
  name: string;
  level: string;
  code: string;
}

export interface User {
  id: string;
  username?: string;
  name?: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  bio?: string;
  country?: string;
  age?: number;
  languagesKnown?: Language[];
  languagesLearn?: Language[];
  isOnline: boolean;
  lastOnline?: string;
  createdAt: string;
  updatedAt: string;
  isVerified: boolean;
}

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

export interface Chat {
  id: string;
  participants?: ChatParticipant[];
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  id: string;
  chatId: string;
  userId: string;
  user?: Partial<User>;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  type: MessageType;
  content?: string;
  mediaUrl?: string;
  createdAt: string;
  read: boolean;
  chatId: string;
  sender?: Partial<User>;
  receiver?: Partial<User>;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  sender?: Partial<User>;
  receiver?: Partial<User>;
}

// Auth / GraphQL inputs
export interface SignupInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
