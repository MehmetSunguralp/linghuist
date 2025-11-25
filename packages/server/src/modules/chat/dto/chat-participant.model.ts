import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../user/dto/user.model';

@ObjectType()
export class ChatParticipantModel {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => User)
  user: User;
}

