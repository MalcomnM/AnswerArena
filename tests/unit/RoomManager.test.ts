import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../../apps/server/src/modules/RoomManager';

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = new RoomManager();
  });

  describe('createRoom', () => {
    it('returns a room code and host pin', () => {
      const { roomCode, hostPin } = manager.createRoom('host-socket-1');
      expect(roomCode).toHaveLength(5);
      expect(hostPin).toHaveLength(6);
    });

    it('room is retrievable after creation', () => {
      const { roomCode } = manager.createRoom('host-socket-1');
      const room = manager.getRoom(roomCode);
      expect(room).toBeDefined();
      expect(room!.phase).toBe('LOBBY');
      expect(room!.hostId).toBe('host-socket-1');
    });

    it('creates unique room codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const { roomCode } = manager.createRoom(`socket-${i}`);
        codes.add(roomCode);
      }
      expect(codes.size).toBe(50);
    });
  });

  describe('joinRoom', () => {
    it('adds a player to an existing room', () => {
      const { roomCode } = manager.createRoom('host');
      const result = manager.joinRoom(roomCode, 'Alice', 'player-socket-1');
      expect(result).not.toBeNull();
      expect(result!.player.displayName).toBe('Alice');
      expect(result!.token).toBeTruthy();
      expect(result!.playerId).toBeTruthy();
    });

    it('returns null for non-existent room', () => {
      const result = manager.joinRoom('XXXXX', 'Alice', 'player-socket-1');
      expect(result).toBeNull();
    });

    it('tracks players in the room', () => {
      const { roomCode } = manager.createRoom('host');
      manager.joinRoom(roomCode, 'Alice', 'ps1');
      manager.joinRoom(roomCode, 'Bob', 'ps2');

      const room = manager.getRoom(roomCode);
      expect(Object.keys(room!.players)).toHaveLength(2);
    });
  });

  describe('rejoinRoom', () => {
    it('restores player on rejoin with valid token', () => {
      const { roomCode } = manager.createRoom('host');
      const joinResult = manager.joinRoom(roomCode, 'Alice', 'ps1');
      expect(joinResult).not.toBeNull();

      manager.handleDisconnect('ps1');
      const room = manager.getRoom(roomCode);
      expect(room!.players[joinResult!.playerId]!.connected).toBe(false);

      const rejoinResult = manager.rejoinRoom(roomCode, joinResult!.token, 'ps2');
      expect(rejoinResult).not.toBeNull();
      expect(rejoinResult!.playerId).toBe(joinResult!.playerId);
      expect(room!.players[joinResult!.playerId]!.connected).toBe(true);
    });

    it('rejects rejoin with invalid token', () => {
      const { roomCode } = manager.createRoom('host');
      const result = manager.rejoinRoom(roomCode, 'bad-token', 'ps1');
      expect(result).toBeNull();
    });

    it('rejects rejoin with wrong room code', () => {
      const { roomCode } = manager.createRoom('host');
      const joinResult = manager.joinRoom(roomCode, 'Alice', 'ps1');
      const result = manager.rejoinRoom('WRONG', joinResult!.token, 'ps2');
      expect(result).toBeNull();
    });
  });

  describe('reclaimHost', () => {
    it('allows host reclaim with correct pin', () => {
      const { roomCode, hostPin } = manager.createRoom('old-host');
      const success = manager.reclaimHost(roomCode, hostPin, 'new-host');
      expect(success).toBe(true);

      const room = manager.getRoom(roomCode);
      expect(room!.hostId).toBe('new-host');
    });

    it('rejects host reclaim with wrong pin', () => {
      const { roomCode } = manager.createRoom('old-host');
      const success = manager.reclaimHost(roomCode, '000000', 'new-host');
      expect(success).toBe(false);

      const room = manager.getRoom(roomCode);
      expect(room!.hostId).toBe('old-host');
    });

    it('rejects host reclaim for non-existent room', () => {
      const success = manager.reclaimHost('XXXXX', '123456', 'new-host');
      expect(success).toBe(false);
    });
  });

  describe('handleDisconnect', () => {
    it('marks player as disconnected', () => {
      const { roomCode } = manager.createRoom('host');
      const joinResult = manager.joinRoom(roomCode, 'Alice', 'ps1');
      const mapping = manager.handleDisconnect('ps1');
      expect(mapping).not.toBeNull();
      expect(mapping!.playerId).toBe(joinResult!.playerId);

      const room = manager.getRoom(roomCode);
      expect(room!.players[joinResult!.playerId]!.connected).toBe(false);
    });

    it('returns null for unknown socket', () => {
      const mapping = manager.handleDisconnect('unknown');
      expect(mapping).toBeNull();
    });
  });

  describe('toPublicState', () => {
    it('excludes host pin from public state', () => {
      const { roomCode } = manager.createRoom('host');
      const room = manager.getRoom(roomCode)!;
      const pub = manager.toPublicState(room);
      expect((pub as any).hostPin).toBeUndefined();
      expect((pub as any).hostId).toBeUndefined();
    });
  });
});
