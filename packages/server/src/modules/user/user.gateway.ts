import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserService } from './user.service';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

@WebSocketGateway({ cors: { origin: '*' } })
export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  constructor(private readonly userService: UserService) {}

  async handleConnection(socket: Socket) {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        socket.handshake.headers?.token;
      if (!token) return socket.disconnect();

      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user) return socket.disconnect();

      const userId = data.user.id;
      socket.data.userId = userId;

      await this.userService.updateUserPresence(userId, true);
      this.server.emit('user_online', { userId });
      console.log(`${userId} connected`);
    } catch {
      socket.disconnect();
    }
  }

  async handleDisconnect(socket: Socket) {
    const userId = socket.data.userId;
    if (!userId) return;
    await this.userService.updateUserPresence(userId, false);
    this.server.emit('user_offline', { userId });
    console.log(`${userId} disconnected`);
  }
}
