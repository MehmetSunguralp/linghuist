import {
  Resolver,
  Query,
  Mutation,
  Args,
  Context,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UserService } from './user.service';
import { UpdateUserInput } from './dto/update_user.input';
import { FriendRequest } from './dto/friend_request.model';
import { User } from './dto/user.model';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User])
  async users() {
    return this.userService.getAllUsers();
  }

  @Query(() => User, { nullable: true })
  async user(@Args('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Query(() => User, { nullable: true })
  async me(@Context('userId') userId: string) {
    if (!userId) throw new Error('Unauthorized');
    return this.userService.getUserById(userId);
  }

  @Mutation(() => User)
  async updateMe(
    @Context('userId') userId: string,
    @Args('data') data: UpdateUserInput,
  ) {
    if (!userId) throw new Error('Unauthorized');
    return this.userService.updateMe(userId, data);
  }

  @Mutation(() => FriendRequest)
  async sendFriendRequest(
    @Context('userId') userId: string,
    @Args('receiverId') receiverId: string,
  ) {
    if (!userId) throw new Error('Unauthorized');
    return this.userService.sendFriendRequest(userId, receiverId);
  }

  @Mutation(() => FriendRequest)
  async respondFriendRequest(
    @Context('userId') userId: string,
    @Args('requestId') requestId: string,
    @Args('accept') accept: boolean,
  ) {
    if (!userId) throw new Error('Unauthorized');
    return this.userService.respondFriendRequest(requestId, userId, accept);
  }

  @Query(() => [User])
  async friends(@Context('userId') userId: string) {
    if (!userId) throw new Error('Unauthorized');
    return this.userService.getFriends(userId);
  }

  @Query(() => [FriendRequest])
  async pendingFriendRequests(@Context('userId') userId: string) {
    if (!userId) throw new Error('Unauthorized');
    return this.userService.getPendingRequests(userId);
  }
}
