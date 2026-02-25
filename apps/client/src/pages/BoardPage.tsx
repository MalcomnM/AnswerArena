import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import { BoardPhaser } from '../components/board/BoardPhaser';
import { ScoreBar } from '../components/board/ScoreBar';
import { RoomCodeOverlay } from '../components/board/RoomCodeOverlay';
import type { PublicRoomState } from '@answer-arena/shared';

export function BoardPage() {
  const [searchParams] = useSearchParams();
  const roomCodeParam = searchParams.get('room') || '';
  const [roomCode, setRoomCode] = useState(roomCodeParam);
  const [joined, setJoined] = useState(false);
  const { socket, connected } = useSocket();
  const gameState = useGameState(socket);

  useEffect(() => {
    if (!socket || !connected || !roomCode || joined) return;

    socket.emit('board:join', { roomCode }, (res) => {
      if ('state' in res) {
        setJoined(true);
      }
    });
  }, [socket, connected, roomCode, joined]);

  if (!joined) {
    return (
      <div style={styles.joinContainer}>
        <h1 style={styles.title}>AnswerArena</h1>
        <p style={styles.subtitle}>Board Display</p>
        <input
          style={styles.input}
          type="text"
          placeholder="Room Code"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          maxLength={6}
          data-testid="board-room-input"
        />
        <button
          style={styles.joinBtn}
          onClick={() => {
            if (socket && connected && roomCode) {
              socket.emit('board:join', { roomCode }, (res) => {
                if ('state' in res) setJoined(true);
              });
            }
          }}
          disabled={!connected || !roomCode}
          data-testid="board-join-btn"
        >
          Connect to Room
        </button>
      </div>
    );
  }

  const rs = gameState.roomState;
  const phase = rs?.phase || 'LOBBY';

  return (
    <div style={styles.boardContainer}>
      {phase === 'LOBBY' && (
        <RoomCodeOverlay
          roomCode={roomCode}
          players={rs?.players ? Object.values(rs.players) : []}
        />
      )}

      {(phase !== 'LOBBY' && phase !== 'GAME_OVER') && (
        <>
          <BoardPhaser
            board={rs?.board ?? null}
            revealedClue={gameState.revealedClue}
            selectedClue={gameState.selectedClue}
            buzzerWinner={gameState.buzzerWinner}
            judgeResult={gameState.judgeResult}
            phase={phase}
            buzzerTimerMs={gameState.buzzerTimerMs}
            revealedAnswer={gameState.revealedAnswer}
          />
          <ScoreBar players={rs?.players ? Object.values(rs.players) : []} />
          <div style={styles.roomCodeSmall} data-testid="board-room-code">{roomCode}</div>
        </>
      )}

      {phase === 'GAME_OVER' && (
        <div style={styles.gameOver}>
          <h1 style={styles.gameOverTitle}>Game Over!</h1>
          <div style={styles.finalScores}>
            {rs?.players && Object.values(rs.players)
              .sort((a, b) => b.score - a.score)
              .map((p, i) => (
                <div key={p.id} style={styles.finalScoreRow}>
                  <span style={styles.rank}>#{i + 1}</span>
                  <span style={styles.playerName}>{p.displayName}</span>
                  <span style={styles.playerScore}>${p.score.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  joinContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '20px',
    background: 'var(--bg-dark)',
  },
  title: { fontSize: '72px', color: 'var(--jeopardy-gold)', fontWeight: 'bold' },
  subtitle: { fontSize: '24px', color: 'var(--text-light)' },
  input: {
    fontSize: '36px',
    padding: '16px 24px',
    textAlign: 'center',
    borderRadius: '12px',
    border: '2px solid var(--jeopardy-gold)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    letterSpacing: '8px',
    width: '300px',
    textTransform: 'uppercase',
  },
  joinBtn: {
    fontSize: '24px',
    padding: '16px 48px',
    borderRadius: '12px',
    background: 'var(--jeopardy-blue)',
    color: 'white',
    fontWeight: 'bold',
  },
  boardContainer: {
    width: '100vw',
    height: '100vh',
    background: 'var(--bg-dark)',
    position: 'relative',
    overflow: 'hidden',
  },
  roomCodeSmall: {
    position: 'absolute',
    top: '8px',
    right: '16px',
    fontSize: '18px',
    color: 'var(--jeopardy-gold)',
    fontWeight: 'bold',
    opacity: 0.8,
  },
  gameOver: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '40px',
  },
  gameOverTitle: { fontSize: '80px', color: 'var(--jeopardy-gold)' },
  finalScores: { display: 'flex', flexDirection: 'column', gap: '20px' },
  finalScoreRow: { display: 'flex', gap: '24px', fontSize: '36px', alignItems: 'center' },
  rank: { color: 'var(--jeopardy-gold)', fontWeight: 'bold', width: '60px' },
  playerName: { color: 'white', minWidth: '200px' },
  playerScore: { color: 'var(--jeopardy-light-gold)', fontWeight: 'bold' },
};
