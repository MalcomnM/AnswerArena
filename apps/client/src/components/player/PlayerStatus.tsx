import type { GamePhase, JudgeResultPayload } from '@answer-arena/shared';

interface Props {
  phase: GamePhase;
  roomCode: string;
  score: number;
  judgeResult: JudgeResultPayload | null;
  playerId: string;
}

export function PlayerStatus({ phase, roomCode, score, judgeResult, playerId }: Props) {
  const isMyResult = judgeResult?.playerId === playerId;
  const showResult = isMyResult && judgeResult;

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <span style={styles.roomBadge}>{roomCode}</span>
        <span style={{
          ...styles.score,
          color: score < 0 ? 'var(--incorrect-red)' : 'var(--jeopardy-gold)',
        }} data-testid="player-score">
          ${score.toLocaleString()}
        </span>
      </div>

      {showResult && (
        <div style={{
          ...styles.resultBadge,
          background: judgeResult.correct ? 'var(--correct-green)' : 'var(--incorrect-red)',
        }} data-testid="judge-feedback">
          {judgeResult.correct ? `+$${judgeResult.scoreChange}` : `$${judgeResult.scoreChange}`}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  roomBadge: {
    fontSize: '14px', fontWeight: 'bold', color: 'var(--jeopardy-gold)',
    background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '8px',
  },
  score: { fontSize: '24px', fontWeight: 'bold' },
  resultBadge: {
    textAlign: 'center', padding: '8px', borderRadius: '8px',
    fontSize: '18px', fontWeight: 'bold', color: 'white',
  },
};
