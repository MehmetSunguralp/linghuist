import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ChatParticipantModel } from './chat-participant.model';
import { MessageModel } from './message.model';

@ObjectType()
export class ChatModel {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [ChatParticipantModel], { nullable: true })
  participants?: ChatParticipantModel[];

  @Field(() => [MessageModel], { nullable: true })
  messages?: MessageModel[];
}
