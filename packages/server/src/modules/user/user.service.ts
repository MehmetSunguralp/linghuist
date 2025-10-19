import { Injectable } from '@nestjs/common';
import { prisma } from 'src/lib/prismaClient';

@Injectable()
export class UserService {
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        languagesKnown: true,
        languagesLearn: true,
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
      languagesKnown?: { name: string; level: string }[];
      languagesLearn?: { name: string; level: string }[];
    },
  ) {
    const updateData: any = {
      //TODO: Fix any type
      username: data.username,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      name: data.name,
    };

    if (data.languagesKnown) {
      updateData.languagesKnown = {
        deleteMany: {},
        create: data.languagesKnown.map((lang) => ({
          name: lang.name,
          level: lang.level,
        })),
      };
    }

    if (data.languagesLearn) {
      updateData.languagesLearn = {
        deleteMany: {},
        create: data.languagesLearn.map((lang) => ({
          name: lang.name,
          level: lang.level,
        })),
      };
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { languagesKnown: true, languagesLearn: true },
    });
  }
}
