import crypto from 'crypto';
import type { RoomState, Player, Board, GameSettings, PublicRoomState, PublicBoard } from '@answer-arena/shared';
import {
  ROOM_CODE_LENGTH,
  HOST_PIN_LENGTH,
  ROOM_EXPIRY_MS,
  DEFAULT_TIMER_MS,
  MAX_PLAYERS,
} from '@answer-arena/shared';

interface PlayerToken {
  playerId: string;
  roomCode: string;
}

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private playerTokens = new Map<string, PlayerToken>();
  private socketToPlayer = new Map<string, { roomCode: string; playerId: string }>();
  private playerToSocket = new Map<string, string>();

  createRoom(hostSocketId: string): { roomCode: string; hostPin: string } {
    const roomCode = this.generateRoomCode();
    const hostPin = this.generatePin();

    const room: RoomState = {
      roomCode,
      hostId: hostSocketId,
      hostPin,
      phase: 'LOBBY',
      players: {},
      board: null,
      activeClue: null,
      buzzerState: null,
      settings: {
        timerDurationMs: DEFAULT_TIMER_MS,
        penaltyEnabled: true,
        reopenOnIncorrect: true,
      },
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };

    this.rooms.set(roomCode, room);
    return { roomCode, hostPin };
  }

  getRoom(roomCode: string): RoomState | undefined {
    return this.rooms.get(roomCode);
  }

  updateRoom(roomCode: string, updater: (room: RoomState) => RoomState): RoomState | undefined {
    const room = this.rooms.get(roomCode);
    if (!room) return undefined;
    const updated = updater(room);
    this.rooms.set(roomCode, updated);
    return updated;
  }

  setRoom(roomCode: string, room: RoomState): void {
    this.rooms.set(roomCode, room);
  }

  joinRoom(
    roomCode: string,
    displayName: string,
    socketId: string,
  ): { playerId: string; token: string; player: Player } | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;
    if (Object.keys(room.players).length >= MAX_PLAYERS) return null;

    const playerId = crypto.randomUUID();
    const token = crypto.randomBytes(16).toString('hex');

    const player: Player = {
      id: playerId,
      displayName,
      score: 0,
      connected: true,
    };

    room.players[playerId] = player;
    room.lastActivityAt = Date.now();

    this.playerTokens.set(token, { playerId, roomCode });
    this.socketToPlayer.set(socketId, { roomCode, playerId });
    this.playerToSocket.set(playerId, socketId);

    return { playerId, token, player };
  }

  rejoinRoom(
    roomCode: string,
    token: string,
    socketId: string,
  ): { playerId: string; player: Player } | null {
    const tokenData = this.playerTokens.get(token);
    if (!tokenData || tokenData.roomCode !== roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players[tokenData.playerId];
    if (!player) return null;

    player.connected = true;
    room.lastActivityAt = Date.now();

    const oldSocketId = this.playerToSocket.get(tokenData.playerId);
    if (oldSocketId) {
      this.socketToPlayer.delete(oldSocketId);
    }
    this.socketToPlayer.set(socketId, { roomCode, playerId: tokenData.playerId });
    this.playerToSocket.set(tokenData.playerId, socketId);

    return { playerId: tokenData.playerId, player };
  }

  handleDisconnect(socketId: string): { roomCode: string; playerId: string } | null {
    const mapping = this.socketToPlayer.get(socketId);
    if (!mapping) return null;

    const room = this.rooms.get(mapping.roomCode);
    if (room) {
      const player = room.players[mapping.playerId];
      if (player) {
        player.connected = false;
      }
    }

    this.socketToPlayer.delete(socketId);
    return mapping;
  }

  reclaimHost(roomCode: string, hostPin: string, newSocketId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    if (room.hostPin !== hostPin) return false;

    room.hostId = newSocketId;
    room.lastActivityAt = Date.now();
    return true;
  }

  setBoard(roomCode: string, board: Board): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    room.board = board;
    room.lastActivityAt = Date.now();
    return true;
  }

  getPlayerSocketId(playerId: string): string | undefined {
    return this.playerToSocket.get(playerId);
  }

  getPlayerBySocket(socketId: string): { roomCode: string; playerId: string } | undefined {
    return this.socketToPlayer.get(socketId);
  }

  toPublicState(room: RoomState): PublicRoomState {
    const publicBoard: PublicBoard | null = room.board
      ? {
          categories: room.board.categories.map(cat => ({
            name: cat.name,
            clues: cat.clues.map(c => ({ value: c.value, used: c.used })),
          })),
        }
      : null;

    return {
      roomCode: room.roomCode,
      phase: room.phase,
      players: room.players,
      board: publicBoard,
      activeClue: room.activeClue
        ? {
            categoryIndex: room.activeClue.categoryIndex,
            clueIndex: room.activeClue.clueIndex,
            clue: room.activeClue.clue.clue,
            value: room.activeClue.clue.value,
            timerStartedAt: room.activeClue.timerStartedAt,
            timerDurationMs: room.activeClue.timerDurationMs,
          }
        : null,
      buzzerState: room.buzzerState,
      settings: room.settings,
    };
  }

  cleanExpiredRooms(): number {
    const now = Date.now();
    let cleaned = 0;
    for (const [code, room] of this.rooms) {
      if (now - room.lastActivityAt > ROOM_EXPIRY_MS) {
        this.rooms.delete(code);
        cleaned++;
      }
    }
    return cleaned;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code: string;
    do {
      code = Array.from(crypto.randomBytes(ROOM_CODE_LENGTH))
        .map(b => chars[b % chars.length])
        .join('');
    } while (this.rooms.has(code));
    return code;
  }

  private generatePin(): string {
    return Array.from(crypto.randomBytes(HOST_PIN_LENGTH))
      .map(b => (b % 10).toString())
      .join('');
  }
}
