import { useState } from 'react';
import type { Board } from '@answer-arena/shared';

interface Props {
  board: Board;
  roomCode: string;
  onRegenerate: () => void;
  onRegenerateCategory: (categoryIndex: number) => void;
  loading: boolean;
}

export function BoardPreview({ board, roomCode, onRegenerate, onRegenerateCategory, loading }: Props) {
  const [expandedCat, setExpandedCat] = useState<number | null>(null);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Board Preview</h3>
        <button
          style={styles.regenAllBtn}
          onClick={onRegenerate}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Regenerate All'}
        </button>
      </div>

      {board.categories.map((cat, ci) => {
        const isExpanded = expandedCat === ci;
        return (
          <div key={ci} style={styles.category}>
            <button
              style={styles.catHeader}
              onClick={() => setExpandedCat(isExpanded ? null : ci)}
            >
              <span style={styles.catName}>{cat.name}</span>
              <span style={styles.catToggle}>{isExpanded ? '▼' : '▶'}</span>
            </button>

            {isExpanded && (
              <div style={styles.clueList}>
                {cat.clues.map((clue, cli) => (
                  <div key={cli} style={styles.clueCard}>
                    <div style={styles.clueHeader}>
                      <span style={styles.clueValue}>${clue.value}</span>
                    </div>
                    <div style={styles.clueBody}>
                      <p style={styles.clueLabel}>Clue:</p>
                      <p style={styles.clueText}>{clue.clue}</p>
                      <p style={styles.answerLabel}>Answer:</p>
                      <p style={styles.answerText}>{clue.answer}</p>
                      {clue.acceptable.length > 0 && (
                        <>
                          <p style={styles.acceptLabel}>Also accept:</p>
                          <p style={styles.acceptText}>{clue.acceptable.join(', ')}</p>
                        </>
                      )}
                      {clue.explanation && (
                        <>
                          <p style={styles.explainLabel}>Why:</p>
                          <p style={styles.explainText}>{clue.explanation}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  style={styles.regenCatBtn}
                  onClick={() => onRegenerateCategory(ci)}
                  disabled={loading}
                >
                  Regenerate "{cat.name}"
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: { fontSize: '20px', color: 'var(--jeopardy-gold)', margin: 0 },
  regenAllBtn: {
    fontSize: '13px',
    padding: '6px 14px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.1)',
    color: 'var(--text-light)',
  },
  category: {
    borderRadius: '10px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
  },
  catHeader: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    background: 'var(--jeopardy-dark)',
    color: 'white',
    fontSize: '17px',
    fontWeight: 'bold',
    textAlign: 'left',
  },
  catName: { flex: 1 },
  catToggle: { fontSize: '12px', color: 'var(--jeopardy-gold)', marginLeft: '8px' },
  clueList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '10px',
  },
  clueCard: {
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  clueHeader: {
    padding: '8px 12px',
    background: 'var(--jeopardy-blue)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clueValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'var(--jeopardy-gold)',
  },
  clueBody: { padding: '10px 12px' },
  clueLabel: { fontSize: '11px', color: 'var(--text-light)', opacity: 0.7, margin: '0 0 2px 0' },
  clueText: { fontSize: '15px', color: 'white', margin: '0 0 10px 0', lineHeight: 1.4 },
  answerLabel: { fontSize: '11px', color: 'var(--correct-green)', opacity: 0.8, margin: '0 0 2px 0' },
  answerText: { fontSize: '15px', color: 'var(--correct-green)', fontWeight: 'bold', margin: '0 0 8px 0' },
  acceptLabel: { fontSize: '11px', color: 'var(--text-light)', opacity: 0.6, margin: '0 0 2px 0' },
  acceptText: { fontSize: '13px', color: 'var(--text-light)', opacity: 0.8, margin: '0 0 8px 0' },
  explainLabel: { fontSize: '11px', color: 'var(--text-light)', opacity: 0.6, margin: '0 0 2px 0' },
  explainText: { fontSize: '13px', color: 'var(--text-light)', opacity: 0.7, margin: 0, fontStyle: 'italic' },
  regenCatBtn: {
    fontSize: '14px',
    padding: '10px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-light)',
    marginTop: '4px',
  },
};
