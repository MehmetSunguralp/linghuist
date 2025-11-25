import { ObjectType, Field } from '@nestjs/graphql';
import { MessageModel } from './message.model';

@ObjectType()
export class MessagesResponseModel {
  @Field(() => [MessageModel])
  messages: MessageModel[];

  @Field(() => Boolean)
  hasMore: boolean;

  @Field(() => String, { nullable: true })
  nextCursor?: string | null;
}

