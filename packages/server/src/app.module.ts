import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AuthModule } from './modules/auth/auth.module';
import { decodeJwt } from './lib/jwt';
import { UserModule } from './modules/user/user.module';
import { PostModule } from './modules/post/post.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
      context: ({ req }) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        let userId = null;
        if (token) {
          const payload = decodeJwt(token);
          userId = payload.sub;
        }
        return { userId };
      },
    }),
    AuthModule,
    UserModule,
    PostModule,
    NotificationModule,
    ChatModule,
  ],
})
export class AppModule {}
