import type { GamePhase, RoomState, ActiveClue, BuzzerState } from '@answer-arena/shared';

export type GameAction =
  | { type: 'HOST_START_GAME' }
  | { type: 'HOST_SELECT_CLUE'; categoryIndex: number; clueIndex: number }
  | { type: 'HOST_REVEAL_CLUE' }
  | { type: 'HOST_OPEN_BUZZING' }
  | { type: 'FIRST_BUZZ'; playerId: string; serverTimestamp: number }
  | { type: 'TIMER_EXPIRED' }
  | { type: 'HOST_JUDGE_CORRECT'; playerId: string }
  | { type: 'HOST_JUDGE_INCORRECT'; playerId: string; reopenBuzzing: boolean }
  | { type: 'HOST_SKIP_CLUE' }
  | { type: 'HOST_RETURN_TO_BOARD' };

export class InvalidTransitionError extends Error {
  constructor(currentPhase: GamePhase, action: string) {
    super(`Invalid transition: cannot perform '${action}' from phase '${currentPhase}'`);
    this.name = 'InvalidTransitionError';
  }
}

const VALID_TRANSITIONS: Record<GamePhase, string[]> = {
  LOBBY: ['HOST_START_GAME'],
  BOARD: ['HOST_SELECT_CLUE'],
  CLUE_SELECTED: ['HOST_REVEAL_CLUE', 'HOST_SKIP_CLUE'],
  CLUE_REVEALED: ['HOST_OPEN_BUZZING', 'HOST_SKIP_CLUE'],
  BUZZING_OPEN: ['FIRST_BUZZ', 'TIMER_EXPIRED', 'HOST_SKIP_CLUE'],
  BUZZING_CLOSED: [],
  JUDGING: ['HOST_JUDGE_CORRECT', 'HOST_JUDGE_INCORRECT', 'HOST_SKIP_CLUE'],
  ANSWER_REVEAL: ['HOST_RETURN_TO_BOARD', 'HOST_SKIP_CLUE'],
  GAME_OVER: [],
};

function allCluesUsed(state: RoomState): boolean {
  if (!state.board) return false;
  return state.board.categories.every(cat => cat.clues.every(c => c.used));
}

export function transition(state: RoomState, action: GameAction): RoomState {
  const allowed = VALID_TRANSITIONS[state.phase];
  if (!allowed?.includes(action.type)) {
    throw new InvalidTransitionError(state.phase, action.type);
  }

  const now = Date.now();
  const base = { ...state, lastActivityAt: now };

  switch (action.type) {
    case 'HOST_START_GAME': {
      return { ...base, phase: 'BOARD' };
    }

    case 'HOST_SELECT_CLUE': {
      const { categoryIndex, clueIndex } = action;
      const board = state.board;
      if (!board) throw new Error('No board loaded');
      const category = board.categories[categoryIndex];
      if (!category) throw new Error('Invalid category index');
      const clue = category.clues[clueIndex];
      if (!clue) throw new Error('Invalid clue index');
      if (clue.used) throw new Error('Clue already used');

      const activeClue: ActiveClue = {
        categoryIndex,
        clueIndex,
        clue,
        timerStartedAt: 0,
        timerDurationMs: state.settings.timerDurationMs,
      };

      return { ...base, phase: 'CLUE_SELECTED', activeClue, buzzerState: null };
    }

    case 'HOST_REVEAL_CLUE': {
      return { ...base, phase: 'CLUE_REVEALED' };
    }

    case 'HOST_OPEN_BUZZING': {
      const buzzerState: BuzzerState = {
        isOpen: true,
        buzzOrder: [],
        winnerId: null,
        lockedOutIds: [],
      };
      const activeClue = state.activeClue
        ? { ...state.activeClue, timerStartedAt: now }
        : state.activeClue;
      return { ...base, phase: 'BUZZING_OPEN', buzzerState, activeClue };
    }

    case 'FIRST_BUZZ': {
      const buzzerState: BuzzerState = {
        ...(state.buzzerState ?? { buzzOrder: [], lockedOutIds: [] }),
        isOpen: false,
        winnerId: action.playerId,
        buzzOrder: [
          ...(state.buzzerState?.buzzOrder ?? []),
          { playerId: action.playerId, serverTimestamp: action.serverTimestamp },
        ],
      };
      return { ...base, phase: 'JUDGING', buzzerState };
    }

    case 'TIMER_EXPIRED': {
      const buzzerState: BuzzerState = {
        ...(state.buzzerState ?? { buzzOrder: [], lockedOutIds: [] }),
        isOpen: false,
        winnerId: null,
      };
      return { ...base, phase: 'ANSWER_REVEAL', buzzerState };
    }

    case 'HOST_JUDGE_CORRECT': {
      const { playerId } = action;
      const value = state.activeClue?.clue.value ?? 0;
      const players = { ...state.players };
      const player = players[playerId];
      if (player) {
        players[playerId] = { ...player, score: player.score + value };
      }
      return { ...base, players, phase: 'ANSWER_REVEAL' };
    }

    case 'HOST_JUDGE_INCORRECT': {
      const { playerId, reopenBuzzing } = action;
      const value = state.activeClue?.clue.value ?? 0;
      const players = { ...state.players };
      const player = players[playerId];
      if (player && state.settings.penaltyEnabled) {
        players[playerId] = { ...player, score: player.score - value };
      }

      const lockedOutIds = [...(state.buzzerState?.lockedOutIds ?? []), playerId];

      if (reopenBuzzing && state.settings.reopenOnIncorrect) {
        const buzzerState: BuzzerState = {
          isOpen: true,
          buzzOrder: state.buzzerState?.buzzOrder ?? [],
          winnerId: null,
          lockedOutIds,
        };
        const activeClue = state.activeClue
          ? { ...state.activeClue, timerStartedAt: now }
          : state.activeClue;
        return { ...base, players, phase: 'BUZZING_OPEN', buzzerState, activeClue };
      }

      const buzzerState: BuzzerState = {
        ...(state.buzzerState ?? { buzzOrder: [], isOpen: false }),
        winnerId: null,
        lockedOutIds,
      };
      return { ...base, players, phase: 'ANSWER_REVEAL', buzzerState };
    }

    case 'HOST_SKIP_CLUE': {
      return markClueUsedAndReturn(base, state.buzzerState);
    }

    case 'HOST_RETURN_TO_BOARD': {
      return markClueUsedAndReturn(base, state.buzzerState);
    }

    default:
      throw new Error(`Unknown action type`);
  }
}

function markClueUsedAndReturn(
  state: RoomState,
  buzzerState: BuzzerState | null,
): RoomState {
  if (state.board && state.activeClue) {
    const board = { ...state.board };
    const categories = board.categories.map((cat, ci) => {
      if (ci !== state.activeClue!.categoryIndex) return cat;
      return {
        ...cat,
        clues: cat.clues.map((clue, cli) => {
          if (cli !== state.activeClue!.clueIndex) return clue;
          return { ...clue, used: true };
        }),
      };
    });
    board.categories = categories;

    const newState = { ...state, board, activeClue: null, buzzerState };

    if (allCluesUsed(newState)) {
      return { ...newState, phase: 'GAME_OVER' };
    }

    return { ...newState, phase: 'BOARD' };
  }

  return { ...state, phase: 'BOARD', activeClue: null, buzzerState };
}
