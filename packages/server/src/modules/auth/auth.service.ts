import { Injectable } from '@nestjs/common';
import supabase from '../../lib/supabaseClient';
import { prisma } from 'src/lib/prismaClient';

@Injectable()
export class AuthService {
  async signup(email: string, password: string) {
    const isExisting = await prisma.user.findUnique({
      where: { email },
    });
    if (isExisting) {
      throw new Error('User with this email already exists');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.SITE_URL}/verified`,
      },
    });
    if (error) throw new Error(error.message);

    if (!data.user?.email) throw new Error('User email is missing');

    await prisma.user.create({
      data: {
        id: data.user.id,
        email: data.user.email,
        name: null,
        username: null,
        bio: null,
      },
    });

    return data.user;
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    const isExisting = await prisma.user.findUnique({
      where: { email },
    });
    if (isExisting === null) {
      throw new Error('User does not exist');
    }
    if (error) throw new Error(error.message);
    if (!isExisting.isVerified) {
      throw new Error('Please verify your email to login to your account');
    }
    return data.session;
  }

  async logout(token: string) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return true;
  }

  async resendVerification(email: string) {
    // Check if user exists in the database
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      throw new Error('No account found with this email');
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${process.env.SITE_URL}/verified`,
      },
    });
    if (error) throw new Error(error.message);
    return true;
  }

  async resetPassword(email: string) {
    // Ensure user exists before sending reset email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      throw new Error('No account found with this email');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3001/reset-password',
    });
    if (error) throw new Error(error.message);
    return true;
  }

  async deleteAccount(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    if (user.role === 'ADMIN' || user.role === 'MODERATOR') {
      throw new Error('Admins and moderators cannot self-delete');
    }

    // Verify password by signing in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    if (signInError) throw new Error('Invalid password');

    // 1) Delete auth user in Supabase
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    // 2) Purge application data referencing this user to avoid FK blocks
    await prisma.$transaction([
      // Friend requests
      prisma.friendRequest.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      }),
      // Notifications (as recipient or actor)
      prisma.notification.deleteMany({
        where: { OR: [{ recipientId: userId }, { actorId: userId }] },
      }),
      // Messages (as sender or receiver)
      prisma.message.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      }),
      // Chat participants
      prisma.chatParticipant.deleteMany({ where: { userId } }),
      // Likes
      prisma.like.deleteMany({ where: { userId } }),
      // Comments
      prisma.comment.deleteMany({ where: { authorId: userId } }),
      // Posts (owned by the user)
      prisma.post.deleteMany({ where: { authorId: userId } }),
      // Disconnect language relations (implicit many-to-many join cleanup)
      prisma.user.update({
        where: { id: userId },
        data: {
          languagesKnown: { set: [] },
          languagesLearn: { set: [] },
        },
      }),
      // Finally, delete the user row
      prisma.user.delete({ where: { id: userId } }),
    ]);
    return true;
  }

  async verifyEmail(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });
    return true;
  }
}
