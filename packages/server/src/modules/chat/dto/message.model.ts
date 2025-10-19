import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../user/dto/user.model';
import { MessageType } from 'src/types/message.types';

@ObjectType()
export class MessageModel {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  mediaUrl?: string;

  @Field()
  type: MessageType;

  @Field()
  createdAt: Date;

  @Field(() => User)
  sender: User;
}
