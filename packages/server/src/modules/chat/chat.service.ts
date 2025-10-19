import { Injectable } from '@nestjs/common';
import { prisma } from 'src/lib/prismaClient';
import { MessageType } from 'src/types/message.types';
import { NotificationType } from 'src/types/notification.types';

@Injectable()
export class ChatService {
  async createOrGetChatBetween(userA: string, userB: string) {
    const candidateChats = await prisma.chat.findMany({
      where: { participants: { some: { userId: userA } } },
      include: {
        participants: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    for (const c of candidateChats) {
      if (c.participants.some((p) => p.userId === userB)) {
        return prisma.chat.findUnique({
          where: { id: c.id },
          include: {
            participants: { include: { user: true } },
            messages: {
              include: { sender: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        });
      }
    }
    const chat = await prisma.chat.create({
      data: {
        participants: { create: [{ userId: userA }, { userId: userB }] },
      },
      include: {
        participants: { include: { user: true } },
        messages: { include: { sender: true } },
      },
    });
    return chat;
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    receiverId?: string,
    content?: string,
    mediaUrl?: string,
    type: MessageType = MessageType.TEXT,
  ) {
    // resolve receiver if not provided
    let actualReceiverId = receiverId;
    if (!actualReceiverId) {
      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { participants: true },
      });
      if (!chat) throw new Error('Chat not found');
      const other = chat.participants.find((p) => p.userId !== senderId);
      if (!other) throw new Error('Receiver not found in chat');
      actualReceiverId = other.userId;
    }

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        receiverId: actualReceiverId,
        content,
        mediaUrl,
        type,
      },
      include: { sender: true },
    });

    // create a notification for the receiver (requires NotificationType.MESSAGE in schema)
    try {
      await prisma.notification.create({
        data: {
          type: 'MESSAGE',
          message: content ?? (mediaUrl ? 'Sent media' : 'New message'),
          recipientId: actualReceiverId,
          actorId: senderId,
        },
      });
    } catch (err) {
      console.error('Failed to create notification for message:', err);
    }

    return message;
  }
  async getUserChats(userId: string) {
    return prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(chatId: string, take = 100) {
    return prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take,
      include: { sender: true },
    });
  }

  async markMessageAsRead(messageId: string, userId: string) {
    const msg = await prisma.message.update({
      where: { id: messageId },
      data: { read: true },
      include: { chat: true },
    });
    return msg;
  }
}
