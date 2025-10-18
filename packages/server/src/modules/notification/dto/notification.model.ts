import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { NotificationType } from 'src/types/notification.types';

registerEnumType(NotificationType, { name: 'NotificationType' });

@ObjectType()
export class Notification {
  @Field(() => ID)
  id: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field()
  message: string;

  @Field()
  read: boolean;

  @Field()
  createdAt: Date;

  @Field(() => String)
  recipientId: string;

  @Field(() => String)
  actorId: string;

  @Field({ nullable: true })
  postId?: string;

  @Field({ nullable: true })
  commentId?: string;
}
