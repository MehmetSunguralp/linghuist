import { Injectable } from '@nestjs/common';
import supabase from '../../lib/supabaseClient';

@Injectable()
export class AuthService {
  async signup(email: string, password: string) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.SITE_URL}/verified`,
      },
    });
    if (error) throw new Error(error.message);
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
