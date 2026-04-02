import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface PresencePayload {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: 'realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // boardId -> Map<socketId, PresencePayload>
  private presence = new Map<string, Map<string, PresencePayload>>();
  // socketId -> boardId (for cleanup on disconnect)
  private socketBoard = new Map<string, string>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (token) {
        const payload = this.jwtService.verify(token);
        client.data.user = payload;
      }
    } catch {
      // unauthenticated — still allow join but no presence
    }
  }

  handleDisconnect(client: Socket) {
    const boardId = this.socketBoard.get(client.id);
    if (boardId) {
      const board = this.presence.get(boardId);
      if (board) {
        board.delete(client.id);
        this.emitPresence(boardId);
      }
      this.socketBoard.delete(client.id);
    }
    client.rooms.forEach((room) => client.leave(room));
  }

  @SubscribeMessage('join-board')
  handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { boardId: string; user?: PresencePayload },
  ) {
    const { boardId, user } = data;
    client.join(`board:${boardId}`);
    this.socketBoard.set(client.id, boardId);

    // Only add to presence if a valid user payload is provided
    if (user?.user_id) {
      if (!this.presence.has(boardId)) {
        this.presence.set(boardId, new Map());
      }
      this.presence.get(boardId).set(client.id, user);
      this.emitPresence(boardId);
    }
  }

  @SubscribeMessage('leave-board')
  handleLeaveBoard(@ConnectedSocket() client: Socket, @MessageBody() boardId: string) {
    client.leave(`board:${boardId}`);
    const board = this.presence.get(boardId);
    if (board) {
      board.delete(client.id);
      this.emitPresence(boardId);
    }
    this.socketBoard.delete(client.id);
  }

  /** Emit board update to all connected clients on that board (excluding sender) */
  broadcastBoardUpdate(boardId: string) {
    this.server.to(`board:${boardId}`).emit('board-updated', { boardId });
  }

  private emitPresence(boardId: string) {
    const board = this.presence.get(boardId);
    const users = board ? [...board.values()] : [];
    // Deduplicate by user_id
    const seen = new Set<string>();
    const unique = users.filter((u) => {
      if (seen.has(u.user_id)) return false;
      seen.add(u.user_id);
      return true;
    });
    this.server.to(`board:${boardId}`).emit('presence-update', unique);
  }
}
