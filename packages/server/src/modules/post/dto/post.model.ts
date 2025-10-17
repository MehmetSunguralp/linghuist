import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../user/dto/user.model';
import { Comment } from './comment.model';

@ObjectType()
export class Post {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  author: User;

  @Field()
  content: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field()
  allowComments: boolean;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[];

  @Field()
  likesCount: number;

  // returns liker list only for owner; resolver enforces access
  @Field(() => [User], { nullable: true })
  likers?: User[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
