import { Injectable } from '@nestjs/common';
import { prisma } from 'src/lib/prismaClient';
import { NotificationType } from 'src/types/notification.types';

@Injectable()
export class NotificationService {
  async createNotification({
    recipientId,
    actorId,
    type,
    message,
    postId,
    commentId,
  }: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    message: string;
    postId?: string;
    commentId?: string;
  }) {
    if (recipientId === actorId) {
      console.info('Not creating notification for self-action');
      return null;
    }

    return prisma.notification.create({
      data: {
        recipientId,
        actorId,
        type,
        message,
        postId,
        commentId,
      },
    });
  }

  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }
}
