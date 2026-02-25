interface Props {
  onCreateRoom: () => void;
  connected: boolean;
}

export function CreateRoom({ onCreateRoom, connected }: Props) {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AnswerArena</h1>
      <p style={styles.subtitle}>Host Controller</p>
      <button
        style={{
          ...styles.createBtn,
          opacity: connected ? 1 : 0.5,
        }}
        onClick={onCreateRoom}
        disabled={!connected}
        data-testid="create-room-btn"
      >
        Create Room
      </button>
      {!connected && <p style={styles.connecting}>Connecting to server...</p>}
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
    background: 'var(--bg-dark)',
    padding: '24px',
  },
  title: { fontSize: '48px', color: 'var(--jeopardy-gold)', fontWeight: 'bold' },
  subtitle: { fontSize: '20px', color: 'var(--text-light)' },
  createBtn: {
    fontSize: '24px',
    padding: '20px 48px',
    borderRadius: '16px',
    background: 'var(--jeopardy-blue)',
    color: 'white',
    fontWeight: 'bold',
    minHeight: '64px',
  },
  connecting: { fontSize: '16px', color: 'var(--text-light)', opacity: 0.7 },
};
