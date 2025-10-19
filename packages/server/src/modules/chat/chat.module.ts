import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';
import { ChatResolver } from './chat.resolver';

@Module({
  imports: [UserModule, NotificationModule],
  providers: [ChatService, ChatGateway, ChatResolver],
  exports: [ChatService],
})
export class ChatModule {}
