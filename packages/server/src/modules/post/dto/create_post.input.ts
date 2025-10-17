import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreatePostInput {
  @Field()
  content: string;

  @Field({ nullable: true })
  imageUrl?: string;

  @Field({ nullable: true })
  allowComments?: boolean;
}
