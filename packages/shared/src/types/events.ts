import type { Player, PublicRoomState, GameSettings } from './gameState.js';
import type { ClueData } from './board.js';

// ─── Client → Server Events ───

export interface HostCreateRoomPayload {}

export interface HostCreateRoomAck {
  roomCode: string;
  hostPin: string;
}

export interface HostStartGamePayload {
  roomCode: string;
}

export interface HostSelectCluePayload {
  categoryIndex: number;
  clueIndex: number;
}

export interface HostRevealCluePayload {}

export interface HostOpenBuzzingPayload {}

export interface HostJudgePayload {
  correct: boolean;
  reopenBuzzing?: boolean;
}

export interface HostSkipCluePayload {}

export interface HostShowAnswerPayload {}

export interface HostReturnToBoardPayload {}

export interface HostReclaimPayload {
  roomCode: string;
  hostPin: string;
}

export interface BoardJoinPayload {
  roomCode: string;
}

export interface BoardJoinAck {
  state: PublicRoomState;
}

export interface PlayerJoinPayload {
  roomCode: string;
  displayName: string;
}

export interface PlayerJoinAck {
  playerId: string;
  token: string;
  state: PublicRoomState;
}

export interface PlayerBuzzPayload {}

export type BuzzRejectionReason = 'closed' | 'locked' | 'already_won' | 'not_in_round';

export interface PlayerBuzzAck {
  accepted: boolean;
  reason?: BuzzRejectionReason;
}

export interface PlayerRejoinPayload {
  roomCode: string;
  token: string;
}

export interface PlayerRejoinAck {
  state: PublicRoomState;
  playerId: string;
}

// ─── Server → Client Events ───

export interface RoomStateUpdatePayload extends PublicRoomState {}

export interface RoomPlayerJoinedPayload {
  player: Player;
}

export interface RoomPlayerLeftPayload {
  playerId: string;
}

export interface ClueSelectedPayload {
  categoryIndex: number;
  clueIndex: number;
}

export interface ClueRevealedPayload {
  clueText: string;
  value: number;
  timerDurationMs: number;
}

export interface ClueFullDataPayload {
  clueText: string;
  value: number;
  answer: string;
  acceptable: string[];
  explanation: string;
}

export interface BuzzerOpenedPayload {
  timerRemainingMs: number;
}

export interface BuzzerAttemptPayload {
  playerId: string;
  accepted: boolean;
  reason?: string;
}

export interface BuzzerWinnerPayload {
  playerId: string;
  displayName: string;
}

export interface BuzzerClosedPayload {
  reason: 'won' | 'timeout';
}

export interface JudgeResultPayload {
  correct: boolean;
  playerId: string;
  scoreChange: number;
  newScore: number;
}

export interface GameOverPayload {
  finalScores: Record<string, number>;
}

export interface AnswerRevealedPayload {
  answer: string;
}

export interface GameErrorPayload {
  code: string;
  message: string;
}

// ─── Event Maps ───

export interface ClientToServerEvents {
  'host:create_room': (payload: HostCreateRoomPayload, ack: (res: HostCreateRoomAck) => void) => void;
  'host:start_game': (payload: HostStartGamePayload) => void;
  'host:select_clue': (payload: HostSelectCluePayload) => void;
  'host:reveal_clue': (payload: HostRevealCluePayload) => void;
  'host:open_buzzing': (payload: HostOpenBuzzingPayload) => void;
  'host:judge': (payload: HostJudgePayload) => void;
  'host:skip_clue': (payload: HostSkipCluePayload) => void;
  'host:show_answer': (payload: HostShowAnswerPayload) => void;
  'host:return_to_board': (payload: HostReturnToBoardPayload) => void;
  'host:reclaim': (payload: HostReclaimPayload, ack: (res: { success: boolean }) => void) => void;
  'board:join': (payload: BoardJoinPayload, ack: (res: BoardJoinAck | GameErrorPayload) => void) => void;
  'player:join': (payload: PlayerJoinPayload, ack: (res: PlayerJoinAck | GameErrorPayload) => void) => void;
  'player:buzz': (payload: PlayerBuzzPayload, ack: (res: PlayerBuzzAck) => void) => void;
  'player:rejoin': (payload: PlayerRejoinPayload, ack: (res: PlayerRejoinAck | GameErrorPayload) => void) => void;
}

export interface ServerToClientEvents {
  'room:state_update': (payload: RoomStateUpdatePayload) => void;
  'room:player_joined': (payload: RoomPlayerJoinedPayload) => void;
  'room:player_left': (payload: RoomPlayerLeftPayload) => void;
  'clue:selected': (payload: ClueSelectedPayload) => void;
  'clue:revealed': (payload: ClueRevealedPayload) => void;
  'clue:full_data': (payload: ClueFullDataPayload) => void;
  'buzzer:opened': (payload: BuzzerOpenedPayload) => void;
  'buzzer:attempt': (payload: BuzzerAttemptPayload) => void;
  'buzzer:winner': (payload: BuzzerWinnerPayload) => void;
  'buzzer:closed': (payload: BuzzerClosedPayload) => void;
  'judge:result': (payload: JudgeResultPayload) => void;
  'answer:revealed': (payload: AnswerRevealedPayload) => void;
  'game:over': (payload: GameOverPayload) => void;
  'error': (payload: GameErrorPayload) => void;
}
