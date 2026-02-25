import type { Player } from '@answer-arena/shared';

interface Props {
  roomCode: string;
  playerName: string;
  players: Player[];
}

export function WaitingRoom({ roomCode, playerName, players }: Props) {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Waiting for Game</h2>
      <p style={styles.roomInfo}>Room: <strong>{roomCode}</strong></p>
      <p style={styles.playerInfo}>You: <strong>{playerName}</strong></p>

      <div style={styles.playerList} data-testid="waiting-player-list">
        <h3 style={styles.listTitle}>Players ({players.length})</h3>
        {players.map(p => (
          <div key={p.id} style={styles.playerRow}>
            <span style={{ ...styles.dot, opacity: p.connected ? 1 : 0.3 }}>●</span>
            <span>{p.displayName}</span>
          </div>
        ))}
      </div>

      <p style={styles.waitText}>Waiting for host to start...</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '16px',
    padding: '24px',
    background: 'var(--bg-dark)',
  },
  title: { fontSize: '32px', color: 'var(--jeopardy-gold)' },
  roomInfo: { fontSize: '18px', color: 'var(--text-light)' },
  playerInfo: { fontSize: '18px', color: 'white' },
  playerList: { width: '100%', maxWidth: '300px', marginTop: '16px' },
  listTitle: { fontSize: '18px', color: 'var(--text-light)', marginBottom: '8px', textAlign: 'center' },
  playerRow: {
    display: 'flex', gap: '8px', alignItems: 'center', fontSize: '16px', color: 'white',
    padding: '6px 0',
  },
  dot: { color: 'var(--correct-green)', fontSize: '10px' },
  waitText: { fontSize: '18px', color: 'var(--text-light)', opacity: 0.6, marginTop: '24px' },
};
