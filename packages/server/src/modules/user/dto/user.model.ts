import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
@ObjectType()
export class UserLanguage {
  @Field()
  name: string;

  @Field()
  level: string;

  @Field()
  code: string;
}

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field(() => String)
  role: 'USER' | 'ADMIN' | 'TEACHER';

  @Field({ nullable: true })
  avatarUrl?: string;

  @Field(() => [UserLanguage], { nullable: true })
  languagesKnown?: UserLanguage[];

  @Field(() => [UserLanguage], { nullable: true })
  languagesLearn?: UserLanguage[];
}
