import { useState } from 'react';

interface Props {
  roomCode: string;
  onBoardGenerated: () => void;
}

export function CategoryManager({ roomCode, onBoardGenerated }: Props) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [customCategories, setCustomCategories] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const categories = customCategories
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/board/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode,
          difficulty,
          ...(categories.length > 0 ? { categories } : {}),
        }),
      });

      if (res.ok) {
        onBoardGenerated();
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Board Setup</h3>

      <label style={styles.label}>
        Difficulty
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value as any)}
          style={styles.select}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>

      <label style={styles.label}>
        Custom Categories (comma-separated, optional)
        <input
          type="text"
          value={customCategories}
          onChange={e => setCustomCategories(e.target.value)}
          placeholder="e.g. Space, Movies, Food"
          style={styles.input}
        />
      </label>

      <button style={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate AI Board'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' },
  title: { fontSize: '20px', color: 'var(--jeopardy-gold)' },
  label: { fontSize: '14px', color: 'var(--text-light)', display: 'flex', flexDirection: 'column', gap: '4px' },
  select: {
    fontSize: '16px', padding: '10px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
  },
  input: {
    fontSize: '16px', padding: '10px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)',
  },
  generateBtn: {
    fontSize: '18px', padding: '14px', borderRadius: '12px',
    background: 'var(--correct-green)', color: 'white', fontWeight: 'bold',
  },
};
