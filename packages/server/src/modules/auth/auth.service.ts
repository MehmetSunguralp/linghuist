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
    return data.session;
  }

  async logout(token: string) {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return true;
  }

  async resendVerification(email: string) {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw new Error(error.message);
    return true;
  }

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:3000/reset-password',
    });
    if (error) throw new Error(error.message);
    return true;
  }

  async deleteAccount(userId: string) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return true;
  }
}
