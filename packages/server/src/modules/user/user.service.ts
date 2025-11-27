import { Injectable } from '@nestjs/common';
import { prisma } from 'src/lib/prismaClient';
import { FriendRequestStatus } from './dto/friend_request.model';
import {
  generateAndUploadThumbnail,
  deleteThumbnail,
} from '../../lib/thumbnailService';
import { supabaseAdmin } from '../../lib/supabaseAdminClient';

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

  async getUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
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
      userThumbnailUrl?: string;
      languagesKnown?: { name: string; level: string; code: string }[];
      languagesLearn?: { name: string; level: string; code: string }[];
    },
  ) {
    // Get current user to check for existing avatar/thumbnail
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, userThumbnailUrl: true },
    });

    // If avatarUrl is being updated, generate new thumbnail
    let thumbnailUrl: string | null = data.userThumbnailUrl || null;
    if (data.avatarUrl && data.avatarUrl !== currentUser?.avatarUrl) {
      // Delete old thumbnail if exists
      if (currentUser?.userThumbnailUrl) {
        await deleteThumbnail(currentUser.userThumbnailUrl);
      }

      // Generate and upload new thumbnail
      thumbnailUrl = await generateAndUploadThumbnail(data.avatarUrl, userId);
    } else if (data.avatarUrl === null && currentUser?.userThumbnailUrl) {
      // If avatar is being removed, delete thumbnail too
      await deleteThumbnail(currentUser.userThumbnailUrl);
      thumbnailUrl = null;
    }

    const updateData: any = {
      //TODO: Fix any type
      username: data.username,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      userThumbnailUrl: thumbnailUrl,
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
      include: {
        sender: {
          include: {
            languagesKnown: true,
            languagesLearn: true,
          },
        },
        receiver: {
          include: {
            languagesKnown: true,
            languagesLearn: true,
          },
        },
      },
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
      include: {
        sender: {
          include: {
            languagesKnown: true,
            languagesLearn: true,
          },
        },
        receiver: {
          include: {
            languagesKnown: true,
            languagesLearn: true,
          },
        },
      },
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
      include: {
        sender: {
          include: {
            languagesKnown: true,
            languagesLearn: true,
          },
        },
        receiver: {
          include: {
            languagesKnown: true,
            languagesLearn: true,
          },
        },
      },
    });
    return pending.map((p) => this.normalizeFriendRequest(p));
  }

  async getSentRequests(userId: string) {
    const sent = await prisma.friendRequest.findMany({
      where: { senderId: userId, status: FriendRequestStatus.PENDING },
      include: {
        sender: {
          include: {
            languagesKnown: true,
            languagesLearn: true,
          },
        },
        receiver: {
          include: {
            languagesKnown: true,
            languagesLearn: true,
          },
        },
      },
    });
    return sent.map((p) => this.normalizeFriendRequest(p));
  }

  async removeFriend(userId: string, friendId: string) {
    if (userId === friendId)
      throw new Error("Can't remove yourself as a friend.");

    // Find the friend request (either direction)
    const friendRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: friendId },
          { senderId: friendId, receiverId: userId },
        ],
        status: FriendRequestStatus.ACCEPTED,
      },
    });

    if (!friendRequest) throw new Error('Friend relationship not found.');

    // Delete the friend request to remove the friendship
    await prisma.friendRequest.delete({
      where: { id: friendRequest.id },
    });

    return { id: friendRequest.id };
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

  async discoverUsers(
    userId: string,
    filter?: {
      countries?: string[];
      minAge?: number;
      maxAge?: number;
      knownLanguages?: string[];
      knownLanguageLevels?: string[];
      learningLanguages?: string[];
      learningLanguageLevels?: string[];
    },
  ) {
    const where: any = {
      id: { not: userId }, // Exclude current user
    };

    // Filter by countries
    if (filter?.countries && filter.countries.length > 0) {
      where.country = { in: filter.countries };
    }

    // Filter by age range
    if (filter?.minAge !== undefined || filter?.maxAge !== undefined) {
      where.age = {};
      if (filter.minAge !== undefined) {
        where.age.gte = filter.minAge;
      }
      if (filter.maxAge !== undefined) {
        where.age.lte = filter.maxAge;
      }
    }

    // Filter by known languages (OR logic - match any of the selected languages)
    if (filter?.knownLanguages && filter.knownLanguages.length > 0) {
      const languageConditions: any[] = [];
      
      filter.knownLanguages.forEach((langName, index) => {
        const levelFilter = filter.knownLanguageLevels?.[index];
        if (levelFilter) {
          languageConditions.push({
            languagesKnown: {
              some: {
                name: langName,
                level: levelFilter,
              },
            },
          });
        } else {
          languageConditions.push({
            languagesKnown: {
              some: {
                name: langName,
              },
            },
          });
        }
      });

      if (languageConditions.length > 0) {
        // Use OR to match any of the selected known languages
        where.AND = where.AND || [];
        where.AND.push({
          OR: languageConditions,
        });
      }
    }

    // Filter by learning languages (OR logic - match any of the selected languages)
    if (filter?.learningLanguages && filter.learningLanguages.length > 0) {
      const languageConditions: any[] = [];
      
      filter.learningLanguages.forEach((langName, index) => {
        const levelFilter = filter.learningLanguageLevels?.[index];
        if (levelFilter) {
          languageConditions.push({
            languagesLearn: {
              some: {
                name: langName,
                level: levelFilter,
              },
            },
          });
        } else {
          languageConditions.push({
            languagesLearn: {
              some: {
                name: langName,
              },
            },
          });
        }
      });

      if (languageConditions.length > 0) {
        // Use OR to match any of the selected learning languages
        where.AND = where.AND || [];
        where.AND.push({
          OR: languageConditions,
        });
      }
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        languagesKnown: true,
        languagesLearn: true,
      },
      orderBy: [
        { isOnline: 'desc' }, // Online users first
        { lastOnline: 'desc' }, // Then by last online (most recent first)
      ],
    });

    // Check and update missing thumbnails for users who have avatars
    // This handles the case where thumbnails exist in storage but DB is null
    const updatePromises = users.map(async (user) => {
      if (user.avatarUrl && !user.userThumbnailUrl && user.id) {
        try {
          // Check if thumbnail exists in bucket by listing files for this user
          // Path format: {userId}/profile/{timestamp}.webp
          const { data: files, error } = await supabaseAdmin.storage
            .from('userThumbnails')
            .list(`${user.id}/profile`, {
              limit: 1,
              sortBy: { column: 'created_at', order: 'desc' },
            });

          if (!error && files && files.length > 0) {
            // Thumbnail exists, update database with the path
            // Format: userThumbnails/{userId}/profile/{filename}
            const thumbnailPath = `userThumbnails/${user.id}/profile/${files[0].name}`;
            await prisma.user.update({
              where: { id: user.id },
              data: { userThumbnailUrl: thumbnailPath },
            });
            // Update the user object in the response
            user.userThumbnailUrl = thumbnailPath;
          } else if (user.avatarUrl) {
            // Thumbnail doesn't exist but avatar does, generate it
            const thumbnailPath = await generateAndUploadThumbnail(
              user.avatarUrl,
              user.id,
            );
            if (thumbnailPath) {
              await prisma.user.update({
                where: { id: user.id },
                data: { userThumbnailUrl: thumbnailPath },
              });
              user.userThumbnailUrl = thumbnailPath;
            }
          }
        } catch (error) {
          // Silently fail - don't block the query if thumbnail check fails
          console.error(
            `Failed to check/update thumbnail for user ${user.id}:`,
            error,
          );
        }
      }
    });

    // Run updates in parallel but don't wait for them to complete
    Promise.all(updatePromises).catch((error) => {
      console.error('Error updating thumbnails:', error);
    });

    return users;
  }
}
