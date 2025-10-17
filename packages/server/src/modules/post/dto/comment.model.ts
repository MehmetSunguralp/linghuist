import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../user/dto/user.model';

@ObjectType()
export class Comment {
  @Field(() => ID)
  id: string;

  @Field(() => User)
  author: User;

  @Field()
  content: string;

  @Field()
  createdAt: Date;
}
