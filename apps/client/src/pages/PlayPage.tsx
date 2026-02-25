import { useState, useCallback, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import { JoinForm } from '../components/player/JoinForm';
import { WaitingRoom } from '../components/player/WaitingRoom';
import { BuzzButton } from '../components/player/BuzzButton';
import { PlayerStatus } from '../components/player/PlayerStatus';
import { CircularTimer } from '../components/common/CircularTimer';
import type { PlayerBuzzAck } from '@answer-arena/shared';

export function PlayPage() {
  const { socket, connected } = useSocket();
  const gameState = useGameState(socket);
  const [playerId, setPlayerId] = useState('');
  const [token, setToken] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [buzzResult, setBuzzResult] = useState<PlayerBuzzAck | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('aa_token');
    const savedRoom = sessionStorage.getItem('aa_room');
    if (savedToken && savedRoom && socket && connected && !joined) {
      socket.emit('player:rejoin', { roomCode: savedRoom, token: savedToken }, (res) => {
        if ('playerId' in res) {
          setPlayerId(res.playerId);
          setToken(savedToken);
          setRoomCode(savedRoom);
          setJoined(true);
        } else {
          sessionStorage.removeItem('aa_token');
          sessionStorage.removeItem('aa_room');
        }
      });
    }
  }, [socket, connected, joined]);

  const handleJoin = useCallback((code: string, displayName: string) => {
    if (!socket || !connected) return;
    setJoinError(null);
    socket.emit('player:join', { roomCode: code, displayName }, (res) => {
      if ('playerId' in res) {
        setPlayerId(res.playerId);
        setToken(res.token);
        setRoomCode(code);
        setJoined(true);
        setJoinError(null);
        sessionStorage.setItem('aa_token', res.token);
        sessionStorage.setItem('aa_room', code);
      } else {
        const err = res as { code?: string; message?: string };
        setJoinError(err.message || 'Room not found. Check the code and try again.');
      }
    });
  }, [socket, connected]);

  const handleBuzz = useCallback(() => {
    if (!socket) return;
    setBuzzResult(null);
    socket.emit('player:buzz', {}, (res) => {
      setBuzzResult(res);
      if (res.accepted && navigator.vibrate) {
        navigator.vibrate(100);
      }
    });
  }, [socket]);

  useEffect(() => {
    if (gameState.roomState?.phase === 'BOARD') {
      setBuzzResult(null);
    }
  }, [gameState.roomState?.phase]);

  if (!joined) {
    return <JoinForm onJoin={handleJoin} connected={connected} error={joinError} />;
  }

  const phase = gameState.roomState?.phase;

  if (phase === 'LOBBY') {
    return (
      <WaitingRoom
        roomCode={roomCode}
        playerName={gameState.roomState?.players[playerId]?.displayName ?? ''}
        players={gameState.roomState?.players ? Object.values(gameState.roomState.players) : []}
      />
    );
  }

  if (phase === 'GAME_OVER') {
    const myScore = gameState.roomState?.players[playerId]?.score ?? 0;
    const sorted = gameState.roomState?.players
      ? Object.values(gameState.roomState.players).sort((a, b) => b.score - a.score)
      : [];
    const rank = sorted.findIndex(p => p.id === playerId) + 1;

    return (
      <div style={styles.gameOver}>
        <h1 style={styles.gameOverTitle}>Game Over!</h1>
        <p style={styles.rank}>You placed #{rank}</p>
        <p style={styles.finalScore}>${myScore.toLocaleString()}</p>
      </div>
    );
  }

  const isMyBuzz = gameState.buzzerWinner?.playerId === playerId;
  const canBuzz = phase === 'BUZZING_OPEN' && gameState.buzzerOpen && !buzzResult;
  const clueText = gameState.revealedClue?.clueText;
  const showTimer = phase === 'BUZZING_OPEN' && gameState.revealedClue;

  return (
    <div style={styles.playerContainer}>
      <PlayerStatus
        phase={phase ?? 'BOARD'}
        roomCode={roomCode}
        score={gameState.roomState?.players[playerId]?.score ?? 0}
        judgeResult={gameState.judgeResult}
        playerId={playerId}
      />

      {showTimer && (
        <CircularTimer
          durationMs={gameState.revealedClue!.timerDurationMs}
          remainingMs={gameState.buzzerTimerMs > 0 ? gameState.buzzerTimerMs : undefined}
          size={72}
        />
      )}

      {clueText && (
        <div style={styles.clueBox} data-testid="player-clue-text">
          <p style={styles.clueValue}>${gameState.revealedClue?.value}</p>
          <p style={styles.clueText}>{clueText}</p>
        </div>
      )}

      {gameState.revealedAnswer && (
        <div style={styles.answerRevealBox}>
          <p style={styles.answerRevealLabel}>Answer:</p>
          <p style={styles.answerRevealText}>{gameState.revealedAnswer}</p>
        </div>
      )}

      <BuzzButton
        canBuzz={canBuzz}
        buzzResult={buzzResult}
        isMyBuzz={isMyBuzz}
        onBuzz={handleBuzz}
        phase={phase ?? 'BOARD'}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  playerContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    padding: '16px',
    gap: '16px',
    background: 'var(--bg-dark)',
  },
  clueBox: {
    background: 'var(--jeopardy-blue)',
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    flex: '0 0 auto',
  },
  clueValue: { fontSize: '24px', fontWeight: 'bold', color: 'var(--jeopardy-gold)', marginBottom: '8px' },
  clueText: { fontSize: '20px', color: 'white', lineHeight: 1.5 },
  answerRevealBox: {
    background: 'rgba(255,215,0,0.15)',
    borderRadius: '16px',
    padding: '16px',
    textAlign: 'center',
    border: '2px solid var(--jeopardy-gold)',
    flex: '0 0 auto',
  },
  answerRevealLabel: { fontSize: '14px', color: 'var(--text-light)', marginBottom: '4px' },
  answerRevealText: { fontSize: '24px', fontWeight: 'bold', color: 'var(--jeopardy-gold)' },
  gameOver: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '16px',
    background: 'var(--bg-dark)',
  },
  gameOverTitle: { fontSize: '48px', color: 'var(--jeopardy-gold)' },
  rank: { fontSize: '32px', color: 'white' },
  finalScore: { fontSize: '48px', fontWeight: 'bold', color: 'var(--jeopardy-gold)' },
};
