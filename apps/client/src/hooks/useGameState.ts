import { useEffect, useReducer, useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PublicRoomState,
  ClueRevealedPayload,
  ClueFullDataPayload,
  BuzzerWinnerPayload,
  BuzzerClosedPayload,
  BuzzerOpenedPayload,
  JudgeResultPayload,
  GameOverPayload,
  RoomPlayerJoinedPayload,
  ClueSelectedPayload,
  AnswerRevealedPayload,
  JudgingTimerStartedPayload,
} from '@answer-arena/shared';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface GameState {
  roomState: PublicRoomState | null;
  revealedClue: ClueRevealedPayload | null;
  fullClueData: ClueFullDataPayload | null;
  buzzerWinner: BuzzerWinnerPayload | null;
  buzzerOpen: boolean;
  buzzerTimerMs: number;
  buzzerDurationMs: number;
  judgingTimerMs: number;
  judgeResult: JudgeResultPayload | null;
  gameOver: GameOverPayload | null;
  selectedClue: ClueSelectedPayload | null;
  revealedAnswer: string | null;
}

type GameStateAction =
  | { type: 'SET_ROOM_STATE'; payload: PublicRoomState }
  | { type: 'CLUE_SELECTED'; payload: ClueSelectedPayload }
  | { type: 'CLUE_REVEALED'; payload: ClueRevealedPayload }
  | { type: 'FULL_CLUE_DATA'; payload: ClueFullDataPayload }
  | { type: 'BUZZER_OPENED'; payload: BuzzerOpenedPayload }
  | { type: 'BUZZER_WINNER'; payload: BuzzerWinnerPayload }
  | { type: 'BUZZER_CLOSED'; payload: BuzzerClosedPayload }
  | { type: 'JUDGE_RESULT'; payload: JudgeResultPayload }
  | { type: 'JUDGING_TIMER_STARTED'; payload: JudgingTimerStartedPayload }
  | { type: 'ANSWER_REVEALED'; payload: AnswerRevealedPayload }
  | { type: 'GAME_OVER'; payload: GameOverPayload }
  | { type: 'RESET_CLUE' };

const initialState: GameState = {
  roomState: null,
  revealedClue: null,
  fullClueData: null,
  buzzerWinner: null,
  buzzerOpen: false,
  buzzerTimerMs: 0,
  buzzerDurationMs: 0,
  judgingTimerMs: 0,
  judgeResult: null,
  gameOver: null,
  selectedClue: null,
  revealedAnswer: null,
};

function reducer(state: GameState, action: GameStateAction): GameState {
  switch (action.type) {
    case 'SET_ROOM_STATE': {
      const rs = action.payload;
      const resetClue = rs.phase === 'BOARD' || rs.phase === 'LOBBY' || rs.phase === 'GAME_OVER';
      return {
        ...state,
        roomState: rs,
        ...(resetClue
          ? {
              revealedClue: null,
              fullClueData: null,
              buzzerWinner: null,
              buzzerOpen: false,
              judgingTimerMs: 0,
              judgeResult: null,
              selectedClue: null,
              revealedAnswer: null,
            }
          : {}),
      };
    }
    case 'CLUE_SELECTED':
      return { ...state, selectedClue: action.payload, revealedClue: null, fullClueData: null, buzzerWinner: null, buzzerOpen: false, buzzerDurationMs: 0, judgingTimerMs: 0, judgeResult: null, revealedAnswer: null };
    case 'CLUE_REVEALED':
      return { ...state, revealedClue: action.payload };
    case 'FULL_CLUE_DATA':
      return { ...state, fullClueData: action.payload };
    case 'BUZZER_OPENED':
      return { ...state, buzzerOpen: true, buzzerTimerMs: action.payload.timerRemainingMs, buzzerDurationMs: action.payload.timerDurationMs, buzzerWinner: null, judgingTimerMs: 0 };
    case 'BUZZER_WINNER':
      return { ...state, buzzerWinner: action.payload, buzzerOpen: false };
    case 'BUZZER_CLOSED':
      return { ...state, buzzerOpen: false };
    case 'JUDGE_RESULT':
      return { ...state, judgeResult: action.payload, judgingTimerMs: 0 };
    case 'JUDGING_TIMER_STARTED':
      return { ...state, judgingTimerMs: action.payload.durationMs };
    case 'ANSWER_REVEALED':
      return { ...state, revealedAnswer: action.payload.answer };
    case 'GAME_OVER':
      return { ...state, gameOver: action.payload };
    case 'RESET_CLUE':
      return { ...state, revealedClue: null, fullClueData: null, buzzerWinner: null, buzzerOpen: false, buzzerDurationMs: 0, judgingTimerMs: 0, judgeResult: null, selectedClue: null, revealedAnswer: null };
    default:
      return state;
  }
}

export function useGameState(socket: TypedSocket | null) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      'room:state_update': (p: PublicRoomState) => dispatch({ type: 'SET_ROOM_STATE', payload: p }),
      'clue:selected': (p: ClueSelectedPayload) => dispatch({ type: 'CLUE_SELECTED', payload: p }),
      'clue:revealed': (p: ClueRevealedPayload) => dispatch({ type: 'CLUE_REVEALED', payload: p }),
      'clue:full_data': (p: ClueFullDataPayload) => dispatch({ type: 'FULL_CLUE_DATA', payload: p }),
      'buzzer:opened': (p: BuzzerOpenedPayload) => dispatch({ type: 'BUZZER_OPENED', payload: p }),
      'buzzer:winner': (p: BuzzerWinnerPayload) => dispatch({ type: 'BUZZER_WINNER', payload: p }),
      'buzzer:closed': (p: BuzzerClosedPayload) => dispatch({ type: 'BUZZER_CLOSED', payload: p }),
      'judge:result': (p: JudgeResultPayload) => dispatch({ type: 'JUDGE_RESULT', payload: p }),
      'judging:timer_started': (p: JudgingTimerStartedPayload) => dispatch({ type: 'JUDGING_TIMER_STARTED', payload: p }),
      'answer:revealed': (p: AnswerRevealedPayload) => dispatch({ type: 'ANSWER_REVEALED', payload: p }),
      'game:over': (p: GameOverPayload) => dispatch({ type: 'GAME_OVER', payload: p }),
    } as const;

    for (const [event, handler] of Object.entries(handlers)) {
      socket.on(event as any, handler as any);
    }

    return () => {
      for (const [event, handler] of Object.entries(handlers)) {
        socket.off(event as any, handler as any);
      }
    };
  }, [socket]);

  const resetClue = useCallback(() => dispatch({ type: 'RESET_CLUE' }), []);

  return { ...state, dispatch, resetClue };
}
