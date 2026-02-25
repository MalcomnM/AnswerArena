import { useState } from 'react';
import type { BuzzerWinnerPayload, ClueFullDataPayload } from '@answer-arena/shared';

interface Props {
  winner: BuzzerWinnerPayload;
  fullClueData: ClueFullDataPayload | null;
  onJudge: (correct: boolean, reopenBuzzing?: boolean) => void;
}

export function JudgePanel({ winner, fullClueData, onJudge }: Props) {
  const [reopenToggle, setReopenToggle] = useState(true);

  return (
    <div style={styles.container} data-testid="judge-panel">
      <div style={styles.responderBox}>
        <p style={styles.responderLabel}>Responding:</p>
        <p style={styles.responderName} data-testid="responder-name">{winner.displayName}</p>
      </div>

      {fullClueData && (
        <div style={styles.answerBox}>
          <p style={styles.answerLabel}>Correct Answer:</p>
          <p style={styles.answer}>{fullClueData.answer}</p>
          {fullClueData.acceptable.length > 0 && (
            <p style={styles.acceptable}>Also accept: {fullClueData.acceptable.join(', ')}</p>
          )}
        </div>
      )}

      <div style={styles.toggleRow}>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={reopenToggle}
            onChange={e => setReopenToggle(e.target.checked)}
            style={styles.checkbox}
          />
          Reopen buzzing on incorrect
        </label>
      </div>

      <div style={styles.judgeButtons}>
        <button
          style={styles.correctBtn}
          onClick={() => onJudge(true)}
          data-testid="judge-correct-btn"
        >
          Correct
        </button>
        <button
          style={styles.incorrectBtn}
          onClick={() => onJudge(false, reopenToggle)}
          data-testid="judge-incorrect-btn"
        >
          Incorrect
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px' },
  responderBox: { textAlign: 'center' },
  responderLabel: { fontSize: '16px', color: 'var(--text-light)' },
  responderName: { fontSize: '32px', fontWeight: 'bold', color: 'white' },
  answerBox: {
    background: 'rgba(255,255,255,0.08)', padding: '16px', borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  answerLabel: { fontSize: '14px', color: 'var(--text-light)', marginBottom: '4px' },
  answer: { fontSize: '24px', color: 'var(--correct-green)', fontWeight: 'bold' },
  acceptable: { fontSize: '14px', color: 'var(--text-light)', marginTop: '4px' },
  toggleRow: { display: 'flex', justifyContent: 'center' },
  toggleLabel: { fontSize: '16px', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '8px' },
  checkbox: { width: '20px', height: '20px' },
  judgeButtons: { display: 'flex', gap: '16px', justifyContent: 'center' },
  correctBtn: {
    fontSize: '22px', padding: '20px 32px', borderRadius: '16px',
    background: 'var(--correct-green)', color: 'white', fontWeight: 'bold',
    flex: 1, maxWidth: '200px', minHeight: '64px',
  },
  incorrectBtn: {
    fontSize: '22px', padding: '20px 32px', borderRadius: '16px',
    background: 'var(--incorrect-red)', color: 'white', fontWeight: 'bold',
    flex: 1, maxWidth: '200px', minHeight: '64px',
  },
};
