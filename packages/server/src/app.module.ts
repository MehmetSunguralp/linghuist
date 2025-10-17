import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AuthModule } from './modules/auth/auth.module';
import { AppResolver } from './app.resolver';
import { decodeJwt } from './lib/jwt';
import { UserModule } from './modules/user/user.module';
import { PostModule } from './modules/post/post.module';

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
  ],
})
export class AppModule {}
