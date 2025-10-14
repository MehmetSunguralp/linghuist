import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UserLanguageInput {
  @Field()
  name: string;

  @Field()
  level: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => [UserLanguageInput], { nullable: true })
  languagesKnown?: UserLanguageInput[];

  @Field(() => [UserLanguageInput], { nullable: true })
  languagesLearn?: UserLanguageInput[];
}
