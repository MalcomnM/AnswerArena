import { describe, it, expect } from 'vitest';
import { receiveBuzz } from '../../apps/server/src/modules/BuzzerAdjudicator';
import type { RoomState } from '@answer-arena/shared';

function makeRoomInBuzzing(overrides?: Partial<RoomState>): RoomState {
  return {
    roomCode: 'TEST1',
    hostId: 'host-socket',
    hostPin: '123456',
    phase: 'BUZZING_OPEN',
    players: {
      p1: { id: 'p1', displayName: 'Player 1', score: 0, connected: true },
      p2: { id: 'p2', displayName: 'Player 2', score: 0, connected: true },
    },
    board: null,
    activeClue: null,
    buzzerState: {
      isOpen: true,
      buzzOrder: [],
      winnerId: null,
      lockedOutIds: [],
    },
    settings: {
      timerDurationMs: 12000,
      penaltyEnabled: true,
      reopenOnIncorrect: true,
    },
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
    ...overrides,
  };
}

describe('BuzzerAdjudicator', () => {
  it('accepts the first buzz', () => {
    const room = makeRoomInBuzzing();
    const result = receiveBuzz(room, 'p1', Date.now());
    expect(result.accepted).toBe(true);
    expect(result.winnerId).toBe('p1');
  });

  it('rejects second buzz after winner is set', () => {
    const room = makeRoomInBuzzing({
      buzzerState: {
        isOpen: true,
        buzzOrder: [{ playerId: 'p1', serverTimestamp: Date.now() - 10 }],
        winnerId: 'p1',
        lockedOutIds: [],
      },
    });
    const result = receiveBuzz(room, 'p2', Date.now());
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('already_won');
  });

  it('rejects buzz when buzzing is closed', () => {
    const room = makeRoomInBuzzing({
      buzzerState: {
        isOpen: false,
        buzzOrder: [],
        winnerId: null,
        lockedOutIds: [],
      },
    });
    const result = receiveBuzz(room, 'p1', Date.now());
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('closed');
  });

  it('rejects buzz from locked out player', () => {
    const room = makeRoomInBuzzing({
      buzzerState: {
        isOpen: true,
        buzzOrder: [],
        winnerId: null,
        lockedOutIds: ['p1'],
      },
    });
    const result = receiveBuzz(room, 'p1', Date.now());
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('locked');
  });

  it('rejects buzz when phase is not BUZZING_OPEN', () => {
    const room = makeRoomInBuzzing({ phase: 'BOARD' });
    const result = receiveBuzz(room, 'p1', Date.now());
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('closed');
  });

  it('rejects buzz from unknown player', () => {
    const room = makeRoomInBuzzing();
    const result = receiveBuzz(room, 'unknown', Date.now());
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('not_in_round');
  });

  it('rejects duplicate buzz from same player', () => {
    const room = makeRoomInBuzzing({
      buzzerState: {
        isOpen: true,
        buzzOrder: [{ playerId: 'p1', serverTimestamp: Date.now() - 10 }],
        winnerId: null,
        lockedOutIds: [],
      },
    });
    const result = receiveBuzz(room, 'p1', Date.now());
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('already_won');
  });

  it('allows non-locked-out player to buzz after reopen', () => {
    const room = makeRoomInBuzzing({
      buzzerState: {
        isOpen: true,
        buzzOrder: [{ playerId: 'p1', serverTimestamp: Date.now() - 100 }],
        winnerId: null,
        lockedOutIds: ['p1'],
      },
    });
    const result = receiveBuzz(room, 'p2', Date.now());
    expect(result.accepted).toBe(true);
    expect(result.winnerId).toBe('p2');
  });
});
