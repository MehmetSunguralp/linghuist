import { ObjectType, Field, ID } from '@nestjs/graphql';
import { FriendRequest } from './friend_request.model';
@ObjectType()
export class UserLanguage {
  @Field()
  name: string;

  @Field()
  level: string;

  @Field()
  code: string;
}

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => String)
  role: 'USER' | 'ADMIN' | 'TEACHER';

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  userThumbnailUrl?: string;

  @Field({ nullable: true })
  country?: string; // ISO-3166 alpha-2 preferred

  @Field({ nullable: true })
  age?: number;

  @Field(() => Boolean)
  isVerified: boolean;

  @Field(() => Boolean)
  isOnline: boolean;

  @Field(() => Date, { nullable: true })
  lastOnline?: Date;

  @Field(() => [UserLanguage], { nullable: true })
  languagesKnown?: UserLanguage[];

  @Field(() => [UserLanguage], { nullable: true })
  languagesLearn?: UserLanguage[];

  @Field(() => [FriendRequest], { nullable: true })
  sentFriendRequests?: FriendRequest[];

  @Field(() => [FriendRequest], { nullable: true })
  receivedFriendRequests?: FriendRequest[];
}
