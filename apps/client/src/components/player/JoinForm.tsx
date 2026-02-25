import { useState } from 'react';

interface Props {
  onJoin: (roomCode: string, displayName: string) => void;
  connected: boolean;
  error?: string | null;
}

export function JoinForm({ onJoin, connected, error }: Props) {
  const [roomCode, setRoomCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joining, setJoining] = useState(false);

  const canJoin = connected && roomCode.length >= 4 && displayName.trim().length > 0 && !joining;

  const handleJoin = () => {
    if (!canJoin) return;
    setJoining(true);
    onJoin(roomCode, displayName.trim());
    setTimeout(() => setJoining(false), 3000);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AnswerArena</h1>

      <input
        style={styles.input}
        type="text"
        placeholder="Room Code"
        value={roomCode}
        onChange={e => { setRoomCode(e.target.value.toUpperCase()); }}
        maxLength={6}
        autoCapitalize="characters"
        data-testid="join-room-code"
      />

      <input
        style={styles.input}
        type="text"
        placeholder="Your Name"
        value={displayName}
        onChange={e => setDisplayName(e.target.value)}
        maxLength={20}
        data-testid="join-display-name"
      />

      <button
        style={{
          ...styles.joinBtn,
          opacity: canJoin ? 1 : 0.4,
        }}
        onClick={handleJoin}
        disabled={!canJoin}
        data-testid="join-btn"
      >
        {joining ? 'Joining...' : 'Join Game'}
      </button>

      {error && <p style={styles.error} data-testid="join-error">{error}</p>}
      {!connected && <p style={styles.connecting}>Connecting...</p>}
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
    gap: '20px',
    padding: '24px',
    background: 'var(--bg-dark)',
  },
  title: { fontSize: '48px', color: 'var(--jeopardy-gold)', fontWeight: 'bold' },
  input: {
    fontSize: '24px',
    padding: '16px 20px',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.08)',
    color: 'white',
    width: '100%',
    maxWidth: '360px',
    textAlign: 'center',
  },
  joinBtn: {
    fontSize: '24px',
    padding: '20px 48px',
    borderRadius: '16px',
    background: 'var(--jeopardy-blue)',
    color: 'white',
    fontWeight: 'bold',
    width: '100%',
    maxWidth: '360px',
    minHeight: '64px',
  },
  error: {
    fontSize: '18px', color: '#FF5252', fontWeight: 'bold', textAlign: 'center',
    padding: '12px 20px', background: 'rgba(255,82,82,0.12)', borderRadius: '12px',
    width: '100%', maxWidth: '360px',
  },
  connecting: { fontSize: '16px', color: 'var(--text-light)', opacity: 0.7 },
};
