import type { ClueFullDataPayload, ClueRevealedPayload, GamePhase } from '@answer-arena/shared';
import { CircularTimer } from '../common/CircularTimer';

interface Props {
  phase: GamePhase;
  fullClueData: ClueFullDataPayload | null;
  revealedClue: ClueRevealedPayload | null;
  buzzerOpen: boolean;
  buzzerTimerMs: number;
  revealedAnswer: string | null;
  onRevealClue: () => void;
  onOpenBuzzing: () => void;
  onSkipClue: () => void;
  onShowAnswer: () => void;
  onReturnToBoard: () => void;
}

export function ClueControls({
  phase,
  fullClueData,
  revealedClue,
  buzzerOpen,
  buzzerTimerMs,
  revealedAnswer,
  onRevealClue,
  onOpenBuzzing,
  onSkipClue,
  onShowAnswer,
  onReturnToBoard,
}: Props) {
  const showTimer = (phase === 'CLUE_REVEALED' || phase === 'BUZZING_OPEN') && revealedClue;

  return (
    <div style={styles.container}>
      {showTimer && (
        <CircularTimer
          durationMs={revealedClue!.timerDurationMs}
          remainingMs={buzzerTimerMs > 0 ? buzzerTimerMs : undefined}
          size={80}
        />
      )}

      {fullClueData && (
        <div style={styles.clueInfo}>
          <p style={styles.value}>${fullClueData.value}</p>
          <p style={styles.clueText}>{fullClueData.clueText}</p>
          <div style={styles.answerBox}>
            <p style={styles.answerLabel}>Answer:</p>
            <p style={styles.answer}>{fullClueData.answer}</p>
            {fullClueData.acceptable.length > 0 && (
              <p style={styles.acceptable}>Also accept: {fullClueData.acceptable.join(', ')}</p>
            )}
            <p style={styles.explanation}>{fullClueData.explanation}</p>
          </div>
        </div>
      )}

      <div style={styles.buttons}>
        {phase === 'CLUE_SELECTED' && (
          <button style={styles.actionBtn} onClick={onRevealClue} data-testid="reveal-clue-btn">
            Reveal to TV
          </button>
        )}

        {phase === 'CLUE_REVEALED' && !buzzerOpen && (
          <button
            style={{ ...styles.actionBtn, background: 'var(--correct-green)' }}
            onClick={onOpenBuzzing}
            data-testid="open-buzzing-btn"
          >
            Open Buzzing
          </button>
        )}

        {buzzerOpen && (
          <p style={styles.buzzerStatus}>Buzzing is OPEN...</p>
        )}

        {phase === 'ANSWER_REVEAL' && !revealedAnswer && (
          <button
            style={{ ...styles.actionBtn, background: 'var(--jeopardy-gold)', color: '#000' }}
            onClick={onShowAnswer}
            data-testid="show-answer-btn"
          >
            Show Answer
          </button>
        )}

        {phase === 'ANSWER_REVEAL' && revealedAnswer && (
          <div style={styles.revealedBox}>
            <p style={styles.revealedLabel}>Answer Revealed:</p>
            <p style={styles.revealedAnswer}>{revealedAnswer}</p>
          </div>
        )}

        {phase === 'ANSWER_REVEAL' && (
          <button
            style={{ ...styles.actionBtn, background: 'var(--correct-green)' }}
            onClick={onReturnToBoard}
            data-testid="return-to-board-btn"
          >
            Return to Board
          </button>
        )}

        <button style={styles.skipBtn} onClick={onSkipClue} data-testid="skip-clue-btn">
          Skip Clue
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' },
  clueInfo: { display: 'flex', flexDirection: 'column', gap: '8px' },
  value: { fontSize: '28px', fontWeight: 'bold', color: 'var(--jeopardy-gold)', textAlign: 'center' },
  clueText: { fontSize: '20px', color: 'white', textAlign: 'center', lineHeight: 1.4 },
  answerBox: {
    background: 'rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  answerLabel: { fontSize: '14px', color: 'var(--text-light)', marginBottom: '4px' },
  answer: { fontSize: '20px', color: 'var(--correct-green)', fontWeight: 'bold' },
  acceptable: { fontSize: '14px', color: 'var(--text-light)', marginTop: '4px' },
  explanation: { fontSize: '14px', color: 'var(--text-light)', marginTop: '8px', fontStyle: 'italic' },
  buttons: { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' },
  actionBtn: {
    fontSize: '20px', padding: '16px 32px', borderRadius: '12px',
    background: 'var(--jeopardy-blue)', color: 'white', fontWeight: 'bold',
    width: '100%', maxWidth: '400px', minHeight: '56px',
  },
  skipBtn: {
    fontSize: '16px', padding: '12px 24px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.1)', color: 'var(--text-light)',
    width: '100%', maxWidth: '400px',
  },
  buzzerStatus: { fontSize: '20px', color: 'var(--jeopardy-gold)', fontWeight: 'bold', textAlign: 'center' },
  revealedBox: {
    background: 'rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px',
    border: '1px solid var(--jeopardy-gold)', textAlign: 'center',
    width: '100%', maxWidth: '400px',
  },
  revealedLabel: { fontSize: '14px', color: 'var(--text-light)', marginBottom: '4px' },
  revealedAnswer: { fontSize: '24px', color: 'var(--jeopardy-gold)', fontWeight: 'bold' },
};
