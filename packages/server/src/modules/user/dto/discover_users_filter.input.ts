import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class DiscoverUsersFilterInput {
  @Field(() => [String], { nullable: true })
  countries?: string[];

  @Field(() => Int, { nullable: true })
  minAge?: number;

  @Field(() => Int, { nullable: true })
  maxAge?: number;

  @Field(() => [String], { nullable: true })
  knownLanguages?: string[];

  @Field(() => [String], { nullable: true })
  knownLanguageLevels?: string[];

  @Field(() => [String], { nullable: true })
  learningLanguages?: string[];

  @Field(() => [String], { nullable: true })
  learningLanguageLevels?: string[];
}

