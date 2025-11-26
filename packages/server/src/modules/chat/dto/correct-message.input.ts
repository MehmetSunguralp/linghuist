import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CorrectMessageInput {
  @Field()
  messageId: string;

  @Field()
  correction: string;
}

