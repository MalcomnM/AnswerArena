import { describe, it, expect } from 'vitest';
import { transition, InvalidTransitionError } from '../../apps/server/src/modules/GameStateMachine';
import type { RoomState, Board } from '@answer-arena/shared';
import { ANSWER_TIMER_MS } from '@answer-arena/shared';

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

describe('GameStateMachine', () => {
  describe('valid transitions', () => {
    it('transitions from LOBBY to BOARD on HOST_START_GAME', () => {
      const room = makeRoom();
      const next = transition(room, { type: 'HOST_START_GAME' });
      expect(next.phase).toBe('BOARD');
    });

    it('transitions from BOARD to CLUE_SELECTED on HOST_SELECT_CLUE', () => {
      const room = makeRoom({ phase: 'BOARD' });
      const next = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      expect(next.phase).toBe('CLUE_SELECTED');
      expect(next.activeClue).not.toBeNull();
      expect(next.activeClue!.categoryIndex).toBe(0);
      expect(next.activeClue!.clueIndex).toBe(0);
    });

    it('transitions from CLUE_SELECTED to CLUE_REVEALED on HOST_REVEAL_CLUE', () => {
      const room = makeRoom({ phase: 'BOARD' });
      const selected = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      const revealed = transition(selected, { type: 'HOST_REVEAL_CLUE' });
      expect(revealed.phase).toBe('CLUE_REVEALED');
    });

    it('transitions from CLUE_REVEALED to BUZZING_OPEN on HOST_OPEN_BUZZING', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      expect(state.phase).toBe('BUZZING_OPEN');
      expect(state.buzzerState).not.toBeNull();
      expect(state.buzzerState!.isOpen).toBe(true);
    });

    it('transitions from BUZZING_OPEN to JUDGING on FIRST_BUZZ', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      expect(state.phase).toBe('JUDGING');
      expect(state.buzzerState!.winnerId).toBe('p1');
    });

    it('transitions from JUDGING to ANSWER_REVEAL on HOST_JUDGE_CORRECT', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      state = transition(state, { type: 'HOST_JUDGE_CORRECT', playerId: 'p1' });
      expect(state.phase).toBe('ANSWER_REVEAL');
      expect(state.activeClue).not.toBeNull();
      expect(state.players.p1!.score).toBe(200);
    });

    it('transitions from JUDGING to BUZZING_OPEN on HOST_JUDGE_INCORRECT with reopen', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      state = transition(state, { type: 'HOST_JUDGE_INCORRECT', playerId: 'p1', reopenBuzzing: true });
      expect(state.phase).toBe('BUZZING_OPEN');
      expect(state.buzzerState!.lockedOutIds).toContain('p1');
      expect(state.buzzerState!.winnerId).toBeNull();
      expect(state.activeClue!.timerDurationMs).toBe(ANSWER_TIMER_MS);
    });

    it('transitions from JUDGING to ANSWER_REVEAL on HOST_JUDGE_INCORRECT without reopen', () => {
      const room = makeRoom({
        phase: 'BOARD',
        settings: { timerDurationMs: 12000, penaltyEnabled: true, reopenOnIncorrect: false },
      });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      state = transition(state, { type: 'HOST_JUDGE_INCORRECT', playerId: 'p1', reopenBuzzing: false });
      expect(state.phase).toBe('ANSWER_REVEAL');
    });

    it('transitions from BUZZING_OPEN to ANSWER_REVEAL on TIMER_EXPIRED', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'TIMER_EXPIRED' });
      expect(state.phase).toBe('ANSWER_REVEAL');
      expect(state.activeClue).not.toBeNull();
      expect(state.board!.categories[0]!.clues[0]!.used).toBe(false);
    });

    it('transitions to GAME_OVER when all clues used after ANSWER_REVEAL', () => {
      const board = makeSampleBoard();
      for (const cat of board.categories) {
        for (const clue of cat.clues) {
          clue.used = true;
        }
      }
      board.categories[0]!.clues[0]!.used = false;

      const room = makeRoom({ phase: 'BOARD', board });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      state = transition(state, { type: 'HOST_JUDGE_CORRECT', playerId: 'p1' });
      expect(state.phase).toBe('ANSWER_REVEAL');
      state = transition(state, { type: 'HOST_RETURN_TO_BOARD' });
      expect(state.phase).toBe('GAME_OVER');
    });
  });

  describe('invalid transitions', () => {
    it('rejects HOST_START_GAME from BOARD', () => {
      const room = makeRoom({ phase: 'BOARD' });
      expect(() => transition(room, { type: 'HOST_START_GAME' })).toThrow(InvalidTransitionError);
    });

    it('rejects HOST_SELECT_CLUE from LOBBY', () => {
      const room = makeRoom({ phase: 'LOBBY' });
      expect(() => transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 })).toThrow(InvalidTransitionError);
    });

    it('rejects FIRST_BUZZ from LOBBY', () => {
      const room = makeRoom({ phase: 'LOBBY' });
      expect(() => transition(room, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() })).toThrow(InvalidTransitionError);
    });

    it('rejects HOST_JUDGE_CORRECT from BOARD', () => {
      const room = makeRoom({ phase: 'BOARD' });
      expect(() => transition(room, { type: 'HOST_JUDGE_CORRECT', playerId: 'p1' })).toThrow(InvalidTransitionError);
    });

    it('rejects HOST_OPEN_BUZZING from GAME_OVER', () => {
      const room = makeRoom({ phase: 'GAME_OVER' });
      expect(() => transition(room, { type: 'HOST_OPEN_BUZZING' })).toThrow(InvalidTransitionError);
    });
  });

  describe('skip clue', () => {
    it('skips from CLUE_SELECTED', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_SKIP_CLUE' });
      expect(state.phase).toBe('BOARD');
      expect(state.board!.categories[0]!.clues[0]!.used).toBe(true);
    });

    it('skips from BUZZING_OPEN', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'HOST_SKIP_CLUE' });
      expect(state.phase).toBe('BOARD');
    });
  });

  describe('ANSWER_REVEAL phase', () => {
    it('transitions from ANSWER_REVEAL to BOARD on HOST_RETURN_TO_BOARD', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'TIMER_EXPIRED' });
      expect(state.phase).toBe('ANSWER_REVEAL');
      state = transition(state, { type: 'HOST_RETURN_TO_BOARD' });
      expect(state.phase).toBe('BOARD');
      expect(state.board!.categories[0]!.clues[0]!.used).toBe(true);
      expect(state.activeClue).toBeNull();
    });

    it('allows HOST_SKIP_CLUE from ANSWER_REVEAL', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'TIMER_EXPIRED' });
      state = transition(state, { type: 'HOST_SKIP_CLUE' });
      expect(state.phase).toBe('BOARD');
      expect(state.board!.categories[0]!.clues[0]!.used).toBe(true);
    });

    it('rejects HOST_OPEN_BUZZING from ANSWER_REVEAL', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'TIMER_EXPIRED' });
      expect(() => transition(state, { type: 'HOST_OPEN_BUZZING' })).toThrow(InvalidTransitionError);
    });

    it('preserves score after correct judgment through ANSWER_REVEAL', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      state = transition(state, { type: 'HOST_JUDGE_CORRECT', playerId: 'p1' });
      expect(state.players.p1!.score).toBe(200);
      state = transition(state, { type: 'HOST_RETURN_TO_BOARD' });
      expect(state.players.p1!.score).toBe(200);
      expect(state.phase).toBe('BOARD');
    });
  });

  describe('FIRST_BUZZ sets judging timer fields', () => {
    it('sets judgingTimerStartedAt and judgingTimerDurationMs on FIRST_BUZZ', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      expect(state.activeClue!.judgingTimerStartedAt).toBe(0);
      expect(state.activeClue!.judgingTimerDurationMs).toBe(0);

      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      expect(state.activeClue!.judgingTimerStartedAt).toBeGreaterThan(0);
      expect(state.activeClue!.judgingTimerDurationMs).toBe(ANSWER_TIMER_MS);
    });
  });

  describe('JUDGING_TIMER_EXPIRED', () => {
    it('locks out winner and reopens buzzing with 10s timer when others remain', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      expect(state.phase).toBe('JUDGING');

      state = transition(state, { type: 'JUDGING_TIMER_EXPIRED' });
      expect(state.phase).toBe('BUZZING_OPEN');
      expect(state.buzzerState!.lockedOutIds).toContain('p1');
      expect(state.buzzerState!.winnerId).toBeNull();
      expect(state.activeClue!.timerDurationMs).toBe(ANSWER_TIMER_MS);
    });

    it('goes to ANSWER_REVEAL when all players are locked out', () => {
      const room = makeRoom({
        phase: 'BOARD',
        players: {
          p1: { id: 'p1', displayName: 'Player 1', score: 0, connected: true },
        },
      });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      state = transition(state, { type: 'JUDGING_TIMER_EXPIRED' });
      expect(state.phase).toBe('ANSWER_REVEAL');
      expect(state.buzzerState!.lockedOutIds).toContain('p1');
    });

    it('applies penalty when penaltyEnabled is true', () => {
      const room = makeRoom({ phase: 'BOARD' });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      state = transition(state, { type: 'JUDGING_TIMER_EXPIRED' });
      expect(state.players.p1!.score).toBe(-200);
    });

    it('does not apply penalty when penaltyEnabled is false', () => {
      const room = makeRoom({
        phase: 'BOARD',
        settings: { timerDurationMs: 12000, penaltyEnabled: false, reopenOnIncorrect: true },
      });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      state = transition(state, { type: 'JUDGING_TIMER_EXPIRED' });
      expect(state.players.p1!.score).toBe(0);
    });

    it('goes to ANSWER_REVEAL when reopenOnIncorrect is false', () => {
      const room = makeRoom({
        phase: 'BOARD',
        settings: { timerDurationMs: 12000, penaltyEnabled: true, reopenOnIncorrect: false },
      });
      let state = transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 });
      state = transition(state, { type: 'HOST_REVEAL_CLUE' });
      state = transition(state, { type: 'HOST_OPEN_BUZZING' });
      state = transition(state, { type: 'FIRST_BUZZ', playerId: 'p1', serverTimestamp: Date.now() });
      state = transition(state, { type: 'JUDGING_TIMER_EXPIRED' });
      expect(state.phase).toBe('ANSWER_REVEAL');
    });

    it('rejects JUDGING_TIMER_EXPIRED from non-JUDGING phase', () => {
      const room = makeRoom({ phase: 'BOARD' });
      expect(() => transition(room, { type: 'JUDGING_TIMER_EXPIRED' })).toThrow(InvalidTransitionError);
    });
  });

  describe('edge cases', () => {
    it('rejects selecting an already used clue', () => {
      const board = makeSampleBoard();
      board.categories[0]!.clues[0]!.used = true;
      const room = makeRoom({ phase: 'BOARD', board });
      expect(() => transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 })).toThrow('already used');
    });

    it('rejects selecting clue when no board loaded', () => {
      const room = makeRoom({ phase: 'BOARD', board: null });
      expect(() => transition(room, { type: 'HOST_SELECT_CLUE', categoryIndex: 0, clueIndex: 0 })).toThrow('No board');
    });
  });
});
