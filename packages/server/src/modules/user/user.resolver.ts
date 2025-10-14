import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UserService } from './user.service';
import { UpdateUserInput } from './dto/update_user.input';
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

  @Mutation(() => User)
  async updateMe(
    @Args('userId') userId: string,
    @Args('data') data: UpdateUserInput,
  ) {
    return this.userService.updateMe(userId, data);
  }

  @Query(() => User, { nullable: true })
  async me(@Context('userId') userId: string) {
    return this.userService.getUserById(userId);
  }
}
