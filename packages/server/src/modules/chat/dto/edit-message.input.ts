import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class EditMessageInput {
  @Field()
  messageId: string;

  @Field()
  content: string;
}

