import type { Player } from '@answer-arena/shared';

interface Props {
  players: Player[];
}

export function ScoreBar({ players }: Props) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div style={styles.container} data-testid="score-bar">
      {sorted.map(p => (
        <div key={p.id} style={styles.playerScore}>
          <span style={styles.name}>{p.displayName}</span>
          <span style={{
            ...styles.score,
            color: p.score < 0 ? 'var(--incorrect-red)' : 'var(--jeopardy-gold)',
          }}>
            ${p.score.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    padding: '12px 24px',
    background: 'rgba(0,0,0,0.8)',
    flexWrap: 'wrap',
  },
  playerScore: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '100px',
  },
  name: { fontSize: '16px', color: 'white', fontWeight: 'bold' },
  score: { fontSize: '22px', fontWeight: 'bold' },
};
