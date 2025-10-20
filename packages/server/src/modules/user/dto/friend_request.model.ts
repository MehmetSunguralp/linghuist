import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { User } from './user.model';

export enum FriendRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

registerEnumType(FriendRequestStatus, {
  name: 'FriendRequestStatus',
});

@ObjectType()
export class FriendRequest {
  @Field()
  id: string;

  @Field(() => FriendRequestStatus)
  status: FriendRequestStatus;

  @Field(() => User)
  sender: User;

  @Field(() => User)
  receiver: User;

  @Field()
  createdAt: Date;
}
