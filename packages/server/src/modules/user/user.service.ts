import { Injectable } from '@nestjs/common';
import { prisma } from 'src/lib/prismaClient';
import { FriendRequestStatus } from './dto/friend_request.model';

@Injectable()
export class UserService {
  private normalizeFriendRequest<T extends { status?: any }>(req: T): T {
    if (req && typeof req.status === 'string') {
      req.status = req.status.toUpperCase();
    }
    return req;
  }

  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        languagesKnown: true,
        languagesLearn: true,
        sentFriendRequests: { include: { receiver: true } },
        receivedFriendRequests: { include: { sender: true } },
      },
    });
  }

  async getAllUsers() {
    return prisma.user.findMany({
      include: {
        languagesKnown: true,
        languagesLearn: true,
      },
    });
  }

  async updateMe(
    userId: string,
    data: {
      name?: string;
      username?: string;
      bio?: string;
      avatarUrl?: string;
      languagesKnown?: { name: string; level: string; code: string }[];
      languagesLearn?: { name: string; level: string; code: string }[];
    },
  ) {
    const updateData: any = {
      //TODO: Fix any type
      username: data.username,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      name: data.name,
      country: (data as any).country,
      age: (data as any).age,
    };

    if (data.languagesKnown) {
      updateData.languagesKnown = {
        deleteMany: {},
        create: data.languagesKnown.map((lang) => ({
          name: lang.name,
          level: lang.level,
          code: lang.code,
        })),
      };
    }

    if (data.languagesLearn) {
      updateData.languagesLearn = {
        deleteMany: {},
        create: data.languagesLearn.map((lang) => ({
          name: lang.name,
          level: lang.level,
          code: lang.code,
        })),
      };
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { languagesKnown: true, languagesLearn: true },
    });
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId)
      throw new Error("Can't send friend request to yourself.");

    const existing = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });

    if (existing) throw new Error('A friend request already exists.');

    const created = await prisma.friendRequest.create({
      data: { senderId, receiverId, status: FriendRequestStatus.PENDING },
      include: { sender: true, receiver: true },
    });

    return this.normalizeFriendRequest(created);
  }
  async respondFriendRequest(
    requestId: string,
    userId: string,
    accept: boolean,
  ) {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error("Can't find request.");
    if (request.receiverId !== userId)
      throw new Error('Receiver can only respond to their own requests.');

    const updated = await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: accept
          ? FriendRequestStatus.ACCEPTED
          : FriendRequestStatus.REJECTED,
      },
      include: { sender: true, receiver: true },
    });

    return this.normalizeFriendRequest(updated);
  }

  async getFriends(userId: string) {
    const accepted = await prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: FriendRequestStatus.ACCEPTED },
          { receiverId: userId, status: FriendRequestStatus.ACCEPTED },
        ],
      },
      include: { sender: true, receiver: true },
    });

    return accepted.map((req) =>
      req.senderId === userId ? req.receiver : req.sender,
    );
  }

  async getPendingRequests(userId: string) {
    const pending = await prisma.friendRequest.findMany({
      where: { receiverId: userId, status: FriendRequestStatus.PENDING },
      include: { sender: true },
    });
    return pending.map((p) => this.normalizeFriendRequest(p));
  }

  async findLanguageMatches(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { languagesKnown: true, languagesLearn: true },
    });

    if (!user) throw new Error('User not found');

    const learnCodes = user.languagesLearn.map((l) => l.code);
    const knownCodes = user.languagesKnown.map((l) => l.code);

    const matches = await prisma.user.findMany({
      where: {
        AND: [
          {
            languagesKnown: {
              some: { code: { in: learnCodes } },
            },
          },
          {
            languagesLearn: {
              some: { code: { in: knownCodes } },
            },
          },
          { id: { not: userId } },
        ],
      },
      include: { languagesKnown: true, languagesLearn: true },
    });

    return matches;
  }

  async updateUserPresence(userId: string, isOnline: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isOnline,
        lastOnline: new Date(),
      },
    });
  }
}
