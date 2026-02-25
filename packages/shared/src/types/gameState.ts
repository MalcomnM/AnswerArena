import type { Board, ClueData } from './board.js';

export type GamePhase =
  | 'LOBBY'
  | 'BOARD'
  | 'CLUE_SELECTED'
  | 'CLUE_REVEALED'
  | 'BUZZING_OPEN'
  | 'BUZZING_CLOSED'
  | 'JUDGING'
  | 'ANSWER_REVEAL'
  | 'GAME_OVER';

export interface Player {
  id: string;
  displayName: string;
  score: number;
  connected: boolean;
}

export interface BuzzAttempt {
  playerId: string;
  serverTimestamp: number;
}

export interface BuzzerState {
  isOpen: boolean;
  buzzOrder: BuzzAttempt[];
  winnerId: string | null;
  lockedOutIds: string[];
}

export interface ActiveClue {
  categoryIndex: number;
  clueIndex: number;
  clue: ClueData;
  timerStartedAt: number;
  timerDurationMs: number;
  judgingTimerStartedAt: number;
  judgingTimerDurationMs: number;
}

export interface GameSettings {
  timerDurationMs: number;
  penaltyEnabled: boolean;
  reopenOnIncorrect: boolean;
}

export interface RoomState {
  roomCode: string;
  hostId: string;
  hostPin: string;
  phase: GamePhase;
  players: Record<string, Player>;
  board: Board | null;
  activeClue: ActiveClue | null;
  buzzerState: BuzzerState | null;
  settings: GameSettings;
  createdAt: number;
  lastActivityAt: number;
}

export type ClientRole = 'board' | 'host' | 'player';

/** State snapshot sent to clients (excludes secrets) */
export interface PublicRoomState {
  roomCode: string;
  phase: GamePhase;
  players: Record<string, Player>;
  board: PublicBoard | null;
  activeClue: PublicActiveClue | null;
  buzzerState: BuzzerState | null;
  settings: GameSettings;
}

export interface PublicBoard {
  categories: {
    name: string;
    clues: { value: number; used: boolean }[];
  }[];
}

export interface PublicActiveClue {
  categoryIndex: number;
  clueIndex: number;
  clue: string;
  value: number;
  timerStartedAt: number;
  timerDurationMs: number;
}
