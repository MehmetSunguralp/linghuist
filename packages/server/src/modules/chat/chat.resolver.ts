import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatModel } from './dto/chat.model';
import { MessageModel } from './dto/message.model';
import { SendMessageInput } from './dto/send-message.input';

@Resolver(() => ChatModel)
export class ChatResolver {
  constructor(private readonly chatService: ChatService) {}

  @Query(() => [ChatModel])
  async myChats(@Args('userId') userId: string) {
    return this.chatService.getUserChats(userId);
  }

  @Query(() => [MessageModel])
  async getMessages(
    @Args('chatId') chatId: string,
    @Args('take') take: number,
  ) {
    return this.chatService.getMessages(chatId, take);
  }

  @Mutation(() => MessageModel)
  async sendMessage(
    @Args('input') input: SendMessageInput,
    @Args('senderId') senderId: string,
    @Args('receiverId', { nullable: true }) receiverId?: string,
  ) {
    return this.chatService.sendMessage(
      input.chatId,
      senderId,
      receiverId,
      input.content,
      input.mediaUrl,
      input.type,
    );
  }
}
