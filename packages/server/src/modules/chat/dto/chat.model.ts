import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class ChatModel {
  @Field(() => ID)
  id: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
