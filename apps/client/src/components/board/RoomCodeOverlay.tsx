import type { Player } from '@answer-arena/shared';

interface Props {
  roomCode: string;
  players: Player[];
}

export function RoomCodeOverlay({ roomCode, players }: Props) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AnswerArena</h1>
      <p style={styles.instruction}>Join at</p>
      <p style={styles.url} data-testid="join-url">{window.location.host}/play</p>
      <div style={styles.codeBox} data-testid="room-code-display">
        <span style={styles.codeLabel}>Room Code</span>
        <span style={styles.code}>{roomCode}</span>
      </div>
      <div style={styles.playerList}>
        <h2 style={styles.playersTitle}>
          Players ({players.length})
        </h2>
        {players.length === 0 && (
          <p style={styles.waiting}>Waiting for players...</p>
        )}
        <div style={styles.playerGrid}>
          {players.map(p => (
            <div key={p.id} style={styles.playerChip} data-testid="player-chip">
              {p.displayName}
            </div>
          ))}
        </div>
      </div>
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
    gap: '24px',
    background: 'linear-gradient(135deg, var(--bg-dark) 0%, var(--jeopardy-dark) 100%)',
  },
  title: { fontSize: '80px', color: 'var(--jeopardy-gold)', fontWeight: 'bold', letterSpacing: '4px' },
  instruction: { fontSize: '28px', color: 'var(--text-light)' },
  url: { fontSize: '32px', color: 'white', fontWeight: 'bold' },
  codeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'rgba(255,255,255,0.1)',
    padding: '24px 48px',
    borderRadius: '16px',
    border: '3px solid var(--jeopardy-gold)',
  },
  codeLabel: { fontSize: '20px', color: 'var(--text-light)', marginBottom: '8px' },
  code: { fontSize: '72px', fontWeight: 'bold', color: 'var(--jeopardy-gold)', letterSpacing: '16px' },
  playerList: { marginTop: '20px', textAlign: 'center' },
  playersTitle: { fontSize: '28px', color: 'var(--text-light)', marginBottom: '16px' },
  waiting: { fontSize: '20px', color: 'var(--text-light)', opacity: 0.6 },
  playerGrid: { display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', maxWidth: '600px' },
  playerChip: {
    fontSize: '22px',
    padding: '8px 20px',
    borderRadius: '24px',
    background: 'var(--jeopardy-blue)',
    color: 'white',
    fontWeight: 'bold',
  },
};
