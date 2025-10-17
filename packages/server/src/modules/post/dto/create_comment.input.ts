import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateCommentInput {
  @Field()
  postId: string;

  @Field()
  content: string;
}
