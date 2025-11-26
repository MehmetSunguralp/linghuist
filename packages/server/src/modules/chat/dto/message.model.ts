import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../user/dto/user.model';
import { MessageType } from 'src/types/message.types';

@ObjectType()
export class MessageModel {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  mediaUrl?: string;

  @Field()
  type: MessageType;

  @Field()
  createdAt: Date;

  @Field()
  senderId: string;

  @Field({ nullable: true })
  receiverId?: string;

  @Field({ nullable: true })
  chatId?: string;

  @Field(() => Boolean)
  read: boolean;

  @Field(() => User, { nullable: true })
  sender?: User;

  @Field(() => Boolean, { nullable: true })
  edited?: boolean;

  @Field(() => Boolean, { nullable: true })
  deleted?: boolean;

  @Field({ nullable: true })
  correctedBy?: string;

  @Field({ nullable: true })
  correction?: string;

  @Field({ nullable: true })
  originalContent?: string;
}
