import { Injectable } from '@nestjs/common';
import { prisma } from 'src/lib/prismaClient';
import { MessageType } from 'src/types/message.types';

@Injectable()
export class ChatService {
  async createOrGetChatBetween(userA: string, userB: string) {
    // Use a transaction to prevent race conditions
    try {
      return await prisma.$transaction(
        async (tx) => {
          // First, check if a chat already exists between these two users
          // Query chats where both users are participants
          const existingChat = await tx.chat.findFirst({
            where: {
              AND: [
                { participants: { some: { userId: userA } } },
                { participants: { some: { userId: userB } } },
              ],
            },
            include: {
              participants: {
                include: { user: true },
              },
              messages: {
                include: { sender: true },
                orderBy: { createdAt: 'asc' },
              },
            },
          });

          if (existingChat) {
            return existingChat;
          }

          // No existing chat found, create a new one
          // This is atomic within the transaction
          const chat = await tx.chat.create({
            data: {
              participants: {
                create: [{ userId: userA }, { userId: userB }],
              },
            },
            include: {
              participants: { include: { user: true } },
              messages: { include: { sender: true } },
            },
          });

          return chat;
        },
        {
          isolationLevel: 'Serializable', // Highest isolation level to prevent race conditions
          timeout: 5000, // 5 second timeout
        },
      );
    } catch (error: any) {
      // If transaction fails due to serialization conflict, retry by finding existing chat
      // This can happen if two requests try to create a chat simultaneously
      if (
        error?.code === 'P2034' ||
        error?.message?.includes('serialization')
      ) {
        const existingChat = await prisma.chat.findFirst({
          where: {
            AND: [
              { participants: { some: { userId: userA } } },
              { participants: { some: { userId: userB } } },
            ],
          },
          include: {
            participants: {
              include: { user: true },
            },
            messages: {
              include: { sender: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        });

        if (existingChat) {
          return existingChat;
        }
      }
      // Re-throw if it's a different error or if no chat was found
      throw error;
    }
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

  async getMessages(
    chatId: string,
    take = 50,
    cursor?: string,
  ): Promise<{
    messages: any[];
    hasMore: boolean;
    nextCursor: string | null;
  }> {
    // If cursor is provided, fetch messages before that cursor (older messages)
    // If no cursor, fetch the most recent messages
    const where: any = { chatId };

    if (cursor) {
      // Get the cursor message to use its createdAt as reference
      const cursorMessage = await prisma.message.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });

      if (cursorMessage) {
        where.createdAt = { lt: cursorMessage.createdAt };
      }
    }

    // Fetch one extra to check if there are more messages
    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      include: { sender: true },
    });

    const hasMore = messages.length > take;
    const messagesToReturn = hasMore ? messages.slice(0, take) : messages;

    // Reverse to get chronological order (oldest first)
    const reversedMessages = [...messagesToReturn].reverse();

    // Get the oldest message ID as next cursor (for fetching older messages)
    const nextCursor =
      hasMore && reversedMessages.length > 0 ? reversedMessages[0].id : null;

    return {
      messages: reversedMessages,
      hasMore,
      nextCursor,
    };
  }

  async markMessageAsRead(messageId: string, userId: string) {
    const msg = await prisma.message.update({
      where: { id: messageId },
      data: { read: true },
      include: { chat: true },
    });
    return msg;
  }

  async clearChat(chatId: string, userId: string) {
    // Verify user is a participant
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    if (!chat) {
      throw new Error('Chat not found');
    }

    const isParticipant = chat.participants.some((p) => p.userId === userId);
    if (!isParticipant) {
      throw new Error('Unauthorized: Not a participant in this chat');
    }

    // Delete all messages and the chat itself (removes from both users' lists)
    // Use a transaction to ensure all deletions succeed or none do
    await prisma.$transaction(async (tx) => {
      // Delete all messages in the chat
      await tx.message.deleteMany({
        where: { chatId },
      });

      // Delete all participants
      await tx.chatParticipant.deleteMany({
        where: { chatId },
      });

      // Finally, delete the chat
      await tx.chat.delete({
        where: { id: chatId },
      });
    });

    return { success: true, chatId };
  }

  async editMessage(messageId: string, userId: string, newContent: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Unauthorized: Can only edit your own messages');
    }

    if ((message as any).deleted) {
      throw new Error('Cannot edit deleted message');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: newContent,
        edited: true,
      } as any,
      include: { sender: true, chat: true },
    });

    return updated as any;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    if (message.senderId !== userId) {
      throw new Error('Unauthorized: Can only delete your own messages');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        deleted: true,
        content: null, // Clear content for deleted messages
      } as any,
      include: { sender: true },
    });

    return updated as any;
  }

  async correctMessage(
    messageId: string,
    correctorId: string,
    correction: string,
  ) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: { include: { participants: true } } },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Verify corrector is a participant in the chat
    const isParticipant = message.chat.participants.some(
      (p) => p.userId === correctorId,
    );
    if (!isParticipant) {
      throw new Error('Unauthorized: Not a participant in this chat');
    }

    // Cannot correct own messages
    if (message.senderId === correctorId) {
      throw new Error('Cannot correct your own messages');
    }

    if ((message as any).deleted) {
      throw new Error('Cannot correct deleted message');
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        correctedBy: correctorId,
        correction: correction,
        originalContent: message.content, // Store original content
      } as any,
      include: { sender: true, chat: true },
    });

    return updated as any;
  }
}
