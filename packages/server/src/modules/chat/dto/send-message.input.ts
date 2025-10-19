import { InputType, Field } from '@nestjs/graphql';
import { MessageType } from 'src/types/message.types';

@InputType()
export class SendMessageInput {
  @Field()
  chatId: string;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  mediaUrl?: string;

  @Field()
  type: MessageType;
}
