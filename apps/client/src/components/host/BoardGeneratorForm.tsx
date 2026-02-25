import { useState } from 'react';
import type { Board } from '@answer-arena/shared';

interface Props {
  roomCode: string;
  onBoardGenerated: (board: Board) => void;
  loading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export function BoardGeneratorForm({ roomCode, onBoardGenerated, loading, onLoadingChange }: Props) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [customPrompt, setCustomPrompt] = useState('');

  const handleGenerate = async () => {
    onLoadingChange(true);
    try {
      const res = await fetch('/api/board/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          difficulty,
          ...(customPrompt.trim() ? { customPrompt: customPrompt.trim() } : {}),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onBoardGenerated(data.board);
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      onLoadingChange(false);
    }
  };

  const handleLoadSample = async () => {
    onLoadingChange(true);
    try {
      const res = await fetch('/api/board/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode }),
      });
      if (res.ok) {
        const data = await res.json();
        onBoardGenerated(data.board);
      }
    } catch (err) {
      console.error('Failed to load sample board:', err);
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Generate Board</h3>

      <label style={styles.label}>
        Difficulty
        <div style={styles.difficultyRow}>
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              style={{
                ...styles.difficultyBtn,
                ...(difficulty === d ? styles.difficultyActive : {}),
              }}
              onClick={() => setDifficulty(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </label>

      <label style={styles.label}>
        Custom Instructions (optional)
        <textarea
          value={customPrompt}
          onChange={e => setCustomPrompt(e.target.value)}
          placeholder="e.g. &quot;80s pop culture theme&quot;, &quot;Science topics for 5th graders&quot;, &quot;Only questions about dogs&quot;..."
          style={styles.textarea}
          rows={3}
        />
        <span style={styles.hint}>
          Describe a theme, audience, or special instructions to guide the AI.
        </span>
      </label>

      <button
        style={styles.generateBtn}
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? 'Generating...' : 'Generate AI Board'}
      </button>

      <div style={styles.divider}>
        <span style={styles.dividerText}>or</span>
      </div>

      <button
        style={styles.sampleBtn}
        onClick={handleLoadSample}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Load Sample Board'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    fontSize: '20px',
    color: 'var(--jeopardy-gold)',
    margin: '0 0 4px 0',
    textAlign: 'center',
  },
  label: {
    fontSize: '14px',
    color: 'var(--text-light)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontWeight: 'bold',
  },
  difficultyRow: {
    display: 'flex',
    gap: '8px',
  },
  difficultyBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-light)',
    border: '2px solid transparent',
    cursor: 'pointer',
  },
  difficultyActive: {
    background: 'rgba(6,12,233,0.3)',
    borderColor: 'var(--jeopardy-blue)',
    color: 'white',
  },
  textarea: {
    fontSize: '15px',
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.08)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.15)',
    resize: 'vertical' as const,
    fontFamily: 'inherit',
    minHeight: '70px',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-light)',
    opacity: 0.6,
    fontWeight: 'normal',
  },
  generateBtn: {
    fontSize: '18px',
    padding: '14px',
    borderRadius: '12px',
    background: 'var(--correct-green)',
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dividerText: {
    fontSize: '13px',
    color: 'var(--text-light)',
    opacity: 0.5,
    flex: 1,
    textAlign: 'center',
  },
  sampleBtn: {
    fontSize: '15px',
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-light)',
    cursor: 'pointer',
  },
};
