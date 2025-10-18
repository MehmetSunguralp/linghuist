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
import { User } from './dto/user.model';
import { Notification } from '../notification/dto/notification.model';
import { prisma } from 'src/lib/prismaClient';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => [User])
  async users() {
    return this.userService.getAllUsers();
  }
  // @ResolveField(() => [Notification])
  // async notifications(@Parent() user: User) {
  //   return prisma.notification.findMany({
  //     where: { recipientId: user.id },
  //     orderBy: { createdAt: 'desc' },
  //   });
  // }

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
}
