import type { PublicBoard } from '@answer-arena/shared';

interface Props {
  board: PublicBoard | null;
  onSelectClue: (categoryIndex: number, clueIndex: number) => void;
}

export function MiniBoard({ board, onSelectClue }: Props) {
  if (!board) return <p style={{ color: 'var(--text-light)' }}>No board loaded</p>;

  return (
    <div style={styles.container} data-testid="mini-board">
      <div style={styles.grid}>
        {board.categories.map((cat, ci) => (
          <div key={ci} style={styles.column}>
            <div style={styles.catHeader} title={cat.name}>
              {cat.name.length > 12 ? cat.name.slice(0, 11) + '…' : cat.name}
            </div>
            {cat.clues.map((clue, cli) => (
              <button
                key={cli}
                style={{
                  ...styles.cell,
                  opacity: clue.used ? 0.2 : 1,
                  textDecoration: clue.used ? 'line-through' : 'none',
                }}
                onClick={() => !clue.used && onSelectClue(ci, cli)}
                disabled={clue.used}
                data-testid={`mini-clue-${ci}-${cli}`}
              >
                ${clue.value}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { width: '100%', overflow: 'auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' },
  column: { display: 'flex', flexDirection: 'column', gap: '4px' },
  catHeader: {
    fontSize: '11px', fontWeight: 'bold', color: 'white',
    background: 'var(--jeopardy-dark)', padding: '8px 4px', textAlign: 'center',
    borderRadius: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cell: {
    fontSize: '16px', fontWeight: 'bold', color: 'var(--jeopardy-gold)',
    background: 'var(--jeopardy-blue)', padding: '12px 4px', textAlign: 'center',
    borderRadius: '4px', minHeight: '48px',
  },
};
