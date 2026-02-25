import { describe, it, expect } from 'vitest';
import { transition } from '../../apps/server/src/modules/GameStateMachine';
import type { RoomState, Board } from '@answer-arena/shared';

function makeSampleBoard(): Board {
  return {
    categories: Array.from({ length: 6 }, (_, ci) => ({
      name: `Category ${ci + 1}`,
      clues: [200, 400, 600, 800, 1000].map((value, cli) => ({
        value: value as 200 | 400 | 600 | 800 | 1000,
        clue: `Clue ${ci}-${cli}`,
        answer: `Answer ${ci}-${cli}`,
        acceptable: [],
        explanation: `Explanation ${ci}-${cli}`,
        used: false,
      })),
    })),
  };
}

function makeRoom(overrides?: Partial<RoomState>): RoomState {
  return {
    roomCode: 'TEST1',
    hostId: 'host-socket',
    hostPin: '123456',
    phase: 'LOBBY',
    players: {
      p1: { id: 'p1', displayName: 'Player 1', score: 0, connected: true },
      p2: { id: 'p2', displayName: 'Player 2', score: 0, connected: true },
    },
    board: makeSampleBoard(),
    activeClue: null,
    buzzerState: null,
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

function playToJudging(room: RoomState, catIdx: number, clueIdx: number, buzzPlayerId: string): RoomState {
  let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: catIdx, clueIndex: clueIdx });
  state = transition(state, { type: 'HOST_REVEAL_CLUE' });
  state = transition(state, { type: 'HOST_OPEN_BUZZING' });
  state = transition(state, { type: 'FIRST_BUZZ', playerId: buzzPlayerId, serverTimestamp: Date.now() });
  return state;
}

describe('Scoring', () => {
  it('adds clue value on correct answer', () => {
    const room = makeRoom({ phase: 'BOARD' });
    let state = playToJudging(room, 0, 0, 'p1');
    state = transition(state, { type: 'HOST_JUDGE_CORRECT', playerId: 'p1' });
    expect(state.players['p1']!.score).toBe(200);
  });

  it('subtracts clue value on incorrect answer when penalty enabled', () => {
    const room = makeRoom({ phase: 'BOARD' });
    let state = playToJudging(room, 0, 0, 'p1');
    state = transition(state, { type: 'HOST_JUDGE_INCORRECT', playerId: 'p1', reopenBuzzing: false });
    expect(state.players['p1']!.score).toBe(-200);
  });

  it('does not subtract on incorrect when penalty disabled', () => {
    const room = makeRoom({
      phase: 'BOARD',
      settings: { timerDurationMs: 12000, penaltyEnabled: false, reopenOnIncorrect: true },
    });
    let state = playToJudging(room, 0, 0, 'p1');
    state = transition(state, { type: 'HOST_JUDGE_INCORRECT', playerId: 'p1', reopenBuzzing: false });
    expect(state.players['p1']!.score).toBe(0);
  });

  it('accumulates score across multiple clues', () => {
    const room = makeRoom({ phase: 'BOARD' });

    let state = playToJudging(room, 0, 0, 'p1');
    state = transition(state, { type: 'HOST_JUDGE_CORRECT', playerId: 'p1' });
    expect(state.players['p1']!.score).toBe(200);

    state = playToJudging(state, 0, 1, 'p1');
    state = transition(state, { type: 'HOST_JUDGE_CORRECT', playerId: 'p1' });
    expect(state.players['p1']!.score).toBe(600);
  });

  it('handles mixed correct and incorrect scoring', () => {
    const room = makeRoom({ phase: 'BOARD' });

    let state = playToJudging(room, 0, 0, 'p1');
    state = transition(state, { type: 'HOST_JUDGE_CORRECT', playerId: 'p1' });
    expect(state.players['p1']!.score).toBe(200);

    state = playToJudging(state, 0, 1, 'p1');
    state = transition(state, { type: 'HOST_JUDGE_INCORRECT', playerId: 'p1', reopenBuzzing: false });
    expect(state.players['p1']!.score).toBe(-200);
  });

  it('allows negative scores', () => {
    const room = makeRoom({ phase: 'BOARD' });

    let state = playToJudging(room, 0, 4, 'p1');
    state = transition(state, { type: 'HOST_JUDGE_INCORRECT', playerId: 'p1', reopenBuzzing: false });
    expect(state.players['p1']!.score).toBe(-1000);
  });
});
