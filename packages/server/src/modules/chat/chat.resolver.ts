import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatModel } from './dto/chat.model';
import { MessageModel } from './dto/message.model';
import { MessagesResponseModel } from './dto/messages-response.model';
import { SendMessageInput } from './dto/send-message.input';
import { EditMessageInput } from './dto/edit-message.input';
import { CorrectMessageInput } from './dto/correct-message.input';

@Resolver(() => ChatModel)
export class ChatResolver {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Query(() => [ChatModel])
  async myChats(@Args('userId') userId: string) {
    return this.chatService.getUserChats(userId);
  }

  @Query(() => MessagesResponseModel)
  async getMessages(
    @Args('chatId') chatId: string,
    @Args('take', { type: () => Int, nullable: true, defaultValue: 30 })
    take: number,
    @Args('cursor', { nullable: true }) cursor?: string,
  ) {
    return this.chatService.getMessages(chatId, take, cursor);
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

  @Mutation(() => Boolean)
  async clearChat(
    @Args('chatId') chatId: string,
    @Args('userId') userId: string,
  ) {
    await this.chatService.clearChat(chatId, userId);
    // Notify both users via WebSocket
    this.chatGateway.notifyChatCleared(chatId);
    return true;
  }

  @Mutation(() => MessageModel)
  async editMessage(
    @Args('input') input: EditMessageInput,
    @Args('userId') userId: string,
  ) {
    const message = await this.chatService.editMessage(
      input.messageId,
      userId,
      input.content,
    );
    // Notify all participants via WebSocket
    if (message.chatId) {
      this.chatGateway.notifyMessageEdited(message.chatId, {
        messageId: message.id,
        content: message.content || '',
        edited: true,
      });
    }
    return message;
  }

  @Mutation(() => MessageModel)
  async deleteMessage(
    @Args('messageId') messageId: string,
    @Args('userId') userId: string,
  ) {
    return this.chatService.deleteMessage(messageId, userId);
  }

  @Mutation(() => MessageModel)
  async correctMessage(
    @Args('input') input: CorrectMessageInput,
    @Args('correctorId') correctorId: string,
  ) {
    const message = await this.chatService.correctMessage(
      input.messageId,
      correctorId,
      input.correction,
    );
    // Notify all participants via WebSocket
    if (message.chatId) {
      const msg = message as any;
      this.chatGateway.notifyMessageCorrected(message.chatId, {
        messageId: message.id,
        correction: msg.correction || '',
        originalContent: msg.originalContent,
        correctedBy: msg.correctedBy || '',
      });
    }
    return message;
  }
}
