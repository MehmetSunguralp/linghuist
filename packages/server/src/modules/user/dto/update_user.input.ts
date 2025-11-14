import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UserLanguageInput {
  @Field()
  name: string;

  @Field()
  level: string;

  @Field()
  code: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field({ nullable: true })
  userThumbnailUrl?: string;

  @Field({ nullable: true })
  country?: string; // ISO-3166 alpha-2 preferred

  @Field({ nullable: true })
  age?: number;

  @Field(() => [UserLanguageInput], { nullable: true })
  languagesKnown?: UserLanguageInput[];

  @Field(() => [UserLanguageInput], { nullable: true })
  languagesLearn?: UserLanguageInput[];
}
