import type { PlayerBuzzAck, GamePhase } from '@answer-arena/shared';

interface Props {
  canBuzz: boolean;
  buzzResult: PlayerBuzzAck | null;
  isMyBuzz: boolean;
  onBuzz: () => void;
  phase: GamePhase;
}

export function BuzzButton({ canBuzz, buzzResult, isMyBuzz, onBuzz, phase }: Props) {
  const getLabel = (): string => {
    if (isMyBuzz) return "You're Up!";
    if (buzzResult?.accepted) return "You're Up!";
    if (buzzResult && !buzzResult.accepted) return 'Too Late!';
    if (canBuzz) return 'BUZZ';
    if (phase === 'BUZZING_OPEN') return 'BUZZ';
    if (phase === 'JUDGING' || phase === 'BUZZING_CLOSED') return 'Locked';
    return 'Wait...';
  };

  const getStyle = (): React.CSSProperties => {
    if (isMyBuzz || buzzResult?.accepted) {
      return { ...styles.button, background: 'var(--correct-green)' };
    }
    if (buzzResult && !buzzResult.accepted) {
      return { ...styles.button, background: 'var(--buzz-disabled)', opacity: 0.7 };
    }
    if (canBuzz) {
      return { ...styles.button, background: 'var(--buzz-red)' };
    }
    return { ...styles.button, background: 'var(--buzz-disabled)', opacity: 0.5 };
  };

  const showBuzz = phase === 'CLUE_REVEALED' || phase === 'BUZZING_OPEN' || phase === 'BUZZING_CLOSED' || phase === 'JUDGING';

  if (!showBuzz) {
    return (
      <div style={styles.waitContainer}>
        <p style={styles.waitText}>
          {phase === 'BOARD' ? 'Waiting for next clue...' : 'Get ready...'}
        </p>
      </div>
    );
  }

  return (
    <button
      style={getStyle()}
      onClick={canBuzz ? onBuzz : undefined}
      disabled={!canBuzz}
      data-testid="buzz-btn"
    >
      {getLabel()}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    flex: 1,
    minHeight: '120px',
    maxHeight: '300px',
    borderRadius: '24px',
    fontSize: '48px',
    fontWeight: 'bold',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    transition: 'background 0.15s, transform 0.1s',
  },
  waitContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitText: { fontSize: '24px', color: 'var(--text-light)', opacity: 0.6 },
};
