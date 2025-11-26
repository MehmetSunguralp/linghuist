import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { UserService } from '../user/user.service';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { MessageType } from 'src/types/message.types';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

@WebSocketGateway({ cors: { origin: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {}

  async handleConnection(socket: Socket) {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.token;
    if (!token) {
      socket.emit('error', 'Unauthenticated');
      socket.disconnect(true);
      return;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      socket.emit('error', 'Invalid or expired token');
      socket.disconnect(true);
      return;
    }

    (socket as any).userId = data.user.id; //TODO: Fix any type
    
    // Update user presence to online
    await this.userService.updateUserPresence(data.user.id, true);
    this.server.emit('user_online', { userId: data.user.id });
    
    socket.emit('connected', { userId: data.user.id });
    console.log(
      `Connected! Socket ID: ${socket.id} - User ID: ${data.user.id}`,
    );
  }
  
  handleDisconnect(socket: Socket) {
    const userId = (socket as any).userId;
    if (!userId) return;
    
    // Update user presence to offline
    this.userService.updateUserPresence(userId, false).catch(console.error);
    this.server.emit('user_offline', { userId });
    console.log(`Disconnected: ${userId || 'Anonymous User'}`);
  }

  afterInit(server: Server) {
    server.on('connection', (socket) => {
      socket.onAny((event, data) => {
        console.log('Incoming event:', event, data);
      });
    });
  }

  @SubscribeMessage('create_or_get_chat')
  async onCreateOrGetChat(
    @MessageBody() payload: { otherUserId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const me = (socket as any).userId; //TODO: Fix any type
    console.log('Hi!');
    if (!me) return socket.emit('error', 'unauthorized');
    const chat = await this.chatService.createOrGetChatBetween(
      me,
      payload.otherUserId,
    );
    if (!chat?.id) return socket.emit('error', 'Chat not found');
    socket.join(chat.id);
    socket.emit('chat', { chatId: chat.id, messages: chat.messages });
  }

  @SubscribeMessage('join_chat')
  async onJoinChat(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const me = (socket as any).userId; //TODO: Fix any type
    if (!me) return socket.emit('error', 'Unauthorized');
    socket.join(payload.chatId);
    socket.emit('joined', { chatId: payload.chatId });
    console.log(`Joined Chat! Chat ID:${payload.chatId}`);
  }

  @SubscribeMessage('leave_chat')
  async onLeaveChat(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const me = (socket as any).userId;
    if (!me) return socket.emit('error', 'Unauthorized');

    socket.leave(payload.chatId);
    socket.emit('left', { chatId: payload.chatId });

    // diğer kullanıcılara bildir
    socket.to(payload.chatId).emit('user_left', {
      chatId: payload.chatId,
      userId: me,
    });

    console.log(`User ${me} left chat ${payload.chatId}`);
  }

  // Notify all participants that a chat has been cleared
  notifyChatCleared(chatId: string) {
    this.server.to(chatId).emit('chat_cleared', { chatId });
  }

  // Notify all participants that a message has been edited
  notifyMessageEdited(
    chatId: string,
    data: { messageId: string; content: string; edited: boolean },
  ) {
    this.server.to(chatId).emit('message_edited', {
      chatId,
      ...data,
    });
  }

  // Notify all participants that a message has been corrected
  notifyMessageCorrected(
    chatId: string,
    data: {
      messageId: string;
      correction: string;
      originalContent: string | null;
      correctedBy: string;
    },
  ) {
    this.server.to(chatId).emit('message_corrected', {
      chatId,
      ...data,
    });
  }

  @SubscribeMessage('send_message')
  async onSendMessage(
    @MessageBody()
    body: {
      chatId: string;
      content: string;
      mediaUrl?: string;
      type: MessageType;
      receiverId: string;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    const senderId = (socket as any).userId; //TODO: Fix any type
    if (!senderId) return socket.emit('error', 'Unauthorized');

    // pass receiverId only if client provides it; service will resolve otherwise
    const message = await this.chatService.sendMessage(
      body.chatId,
      senderId,
      body.receiverId,
      body.content,
      body.mediaUrl,
      body.type,
    );

    // optional: update chat updatedAt (or rely on DB cascade)
    await this.chatService.getUserChats(senderId); // touch

    // emit to room
    this.server.to(body.chatId).emit('message', message);
  }

  // typing indicator
  @SubscribeMessage('typing')
  async onTyping(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = (socket as any).userId; //TODO: Fix any type
    if (!userId) return socket.emit('error', 'unauthorized');
    // broadcast to others in the room
    socket
      .to(payload.chatId)
      .emit('typing', { chatId: payload.chatId, userId });
  }

  @SubscribeMessage('stop_typing')
  async onStopTyping(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = (socket as any).userId; //TODO: Fix any type
    if (!userId) return socket.emit('error', 'Unauthorized');
    socket
      .to(payload.chatId)
      .emit('stop_typing', { chatId: payload.chatId, userId });
  }

  @SubscribeMessage('message_read')
  async onMarkRead(
    @MessageBody() payload: { messageId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const userId = (socket as any).userId;
    if (!userId) return socket.emit('error', 'unauthorized');

    const updated = await this.chatService.markMessageAsRead(
      payload.messageId,
      userId,
    );
    this.server.to(updated.chatId).emit('message_read', {
      messageId: updated.id,
      chatId: updated.chatId,
      readerId: userId,
    });
  }

  @SubscribeMessage('message') //Temporary handler for Postman Tests
  handleRawEvent(
    @MessageBody() payload: { event: string; data: any },
    @ConnectedSocket() socket: Socket,
  ) {
    console.log('Raw payload event:', payload.event);
    if (payload.event === 'create_or_get_chat') {
      return this.onCreateOrGetChat(payload.data, socket);
    }
    if (payload.event === 'join_chat') {
      return this.onJoinChat(payload.data, socket);
    }
    if (payload.event === 'send_message') {
      return this.onSendMessage(payload.data, socket);
    }
    if (payload.event === 'typing') {
      return this.onTyping(payload.data, socket);
    }
    if (payload.event === 'stop_typing') {
      return this.onStopTyping(payload.data, socket);
    }
    if (payload.event === 'message_read') {
      return this.onMarkRead(payload.data, socket);
    }
    if (payload.event === 'leave_chat') {
      return this.onLeaveChat(payload.data, socket);
    }
  }
}
