import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { NotificationService } from './notification.service';
import { Notification } from './dto/notification.model';

@Resolver(() => Notification)
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}

  @Query(() => [Notification])
  async myNotifications(@Context('userId') userId: string) {
    return this.notificationService.getUserNotifications(userId);
  }

  @Mutation(() => Notification)
  async markNotificationRead(@Args('id') id: string) {
    return this.notificationService.markAsRead(id);
  }
}
