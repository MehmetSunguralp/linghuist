import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => Boolean)
  async signup(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    await this.authService.signup(email, password);
    return true;
  }

  @Mutation(() => String)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ) {
    const session = await this.authService.login(email, password);
    return session.access_token;
  }

  @Mutation(() => Boolean)
  async logout(@Args('token') token: string) {
    return this.authService.logout(token);
  }

  @Mutation(() => Boolean)
  async resendVerification(@Args('email') email: string) {
    return this.authService.resendVerification(email);
  }

  @Mutation(() => Boolean)
  async resetPassword(@Args('email') email: string) {
    return this.authService.resetPassword(email);
  }

  @Mutation(() => Boolean)
  async deleteAccount(@Args('userId') userId: string) {
    return this.authService.deleteAccount(userId);
  }

  @Mutation(() => Boolean)
  async verifyEmail(@Args('userId') userId: string) {
    return this.authService.verifyEmail(userId);
  }
}
