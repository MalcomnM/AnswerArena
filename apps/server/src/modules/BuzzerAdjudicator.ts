import type { RoomState, BuzzAttempt } from '@answer-arena/shared';

export interface BuzzResult {
  accepted: boolean;
  reason?: 'closed' | 'locked' | 'already_won' | 'not_in_round';
  winnerId?: string;
}

export function receiveBuzz(
  state: RoomState,
  playerId: string,
  serverTimestamp: number,
): BuzzResult {
  if (state.phase !== 'BUZZING_OPEN') {
    return { accepted: false, reason: 'closed' };
  }

  const buzzer = state.buzzerState;
  if (!buzzer || !buzzer.isOpen) {
    return { accepted: false, reason: 'closed' };
  }

  if (!(playerId in state.players)) {
    return { accepted: false, reason: 'not_in_round' };
  }

  if (buzzer.lockedOutIds.includes(playerId)) {
    return { accepted: false, reason: 'locked' };
  }

  if (buzzer.winnerId) {
    return { accepted: false, reason: 'already_won' };
  }

  const alreadyBuzzed = buzzer.buzzOrder.some(b => b.playerId === playerId);
  if (alreadyBuzzed) {
    return { accepted: false, reason: 'already_won' };
  }

  return { accepted: true, winnerId: playerId };
}
