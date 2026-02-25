import { useState, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useGameState } from '../hooks/useGameState';
import { CreateRoom } from '../components/host/CreateRoom';
import { HostLobby } from '../components/host/HostLobby';
import { MiniBoard } from '../components/host/MiniBoard';
import { JudgePanel } from '../components/host/JudgePanel';
import { ClueControls } from '../components/host/ClueControls';

export function HostPage() {
  const { socket, connected } = useSocket();
  const gameState = useGameState(socket);
  const [roomCode, setRoomCode] = useState('');
  const [hostPin, setHostPin] = useState('');

  const handleCreateRoom = useCallback(() => {
    if (!socket || !connected) return;
    socket.emit('host:create_room', {}, (res) => {
      setRoomCode(res.roomCode);
      setHostPin(res.hostPin);
    });
  }, [socket, connected]);

  const handleStartGame = useCallback(() => {
    if (!socket || !roomCode) return;
    socket.emit('host:start_game', { roomCode });
  }, [socket, roomCode]);

  const handleSelectClue = useCallback((categoryIndex: number, clueIndex: number) => {
    if (!socket) return;
    socket.emit('host:select_clue', { categoryIndex, clueIndex });
  }, [socket]);

  const handleRevealClue = useCallback(() => {
    if (!socket) return;
    socket.emit('host:reveal_clue', {});
  }, [socket]);

  const handleJudge = useCallback((correct: boolean, reopenBuzzing?: boolean) => {
    if (!socket) return;
    socket.emit('host:judge', { correct, reopenBuzzing });
  }, [socket]);

  const handleSkipClue = useCallback(() => {
    if (!socket) return;
    socket.emit('host:skip_clue', {});
  }, [socket]);

  const handleShowAnswer = useCallback(() => {
    if (!socket) return;
    socket.emit('host:show_answer', {});
  }, [socket]);

  const handleReturnToBoard = useCallback(() => {
    if (!socket) return;
    socket.emit('host:return_to_board', {});
  }, [socket]);

  const phase = gameState.roomState?.phase;

  if (!roomCode) {
    return <CreateRoom onCreateRoom={handleCreateRoom} connected={connected} />;
  }

  if (phase === 'LOBBY' || !phase) {
    return (
      <HostLobby
        roomCode={roomCode}
        hostPin={hostPin}
        players={gameState.roomState?.players ? Object.values(gameState.roomState.players) : []}
        onStartGame={handleStartGame}
        boardLoaded={!!gameState.roomState?.board}
      />
    );
  }

  if (phase === 'GAME_OVER') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Game Over!</h1>
        <div style={styles.scores}>
          {gameState.roomState?.players && Object.values(gameState.roomState.players)
            .sort((a, b) => b.score - a.score)
            .map((p, i) => (
              <div key={p.id} style={styles.scoreRow}>
                #{i + 1} {p.displayName}: ${p.score.toLocaleString()}
              </div>
            ))}
        </div>
      </div>
    );
  }

  const showMiniBoard = phase === 'BOARD';
  const showClueControls = phase === 'CLUE_SELECTED' || phase === 'CLUE_REVEALED' || phase === 'BUZZING_OPEN' || phase === 'ANSWER_REVEAL';
  const showJudge = phase === 'JUDGING' || phase === 'BUZZING_CLOSED';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.roomBadge}>{roomCode}</span>
        <span style={styles.phaseBadge} data-testid="host-phase">{phase}</span>
      </div>

      {showMiniBoard && (
        <MiniBoard
          board={gameState.roomState?.board ?? null}
          onSelectClue={handleSelectClue}
        />
      )}

      {showClueControls && (
        <ClueControls
          phase={phase}
          fullClueData={gameState.fullClueData}
          revealedClue={gameState.revealedClue}
          buzzerOpen={gameState.buzzerOpen}
          buzzerTimerMs={gameState.buzzerTimerMs}
          revealedAnswer={gameState.revealedAnswer}
          onRevealClue={handleRevealClue}
          onSkipClue={handleSkipClue}
          onShowAnswer={handleShowAnswer}
          onReturnToBoard={handleReturnToBoard}
        />
      )}

      {showJudge && gameState.buzzerWinner && (
        <JudgePanel
          winner={gameState.buzzerWinner}
          fullClueData={gameState.fullClueData}
          onJudge={handleJudge}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--bg-dark)',
    padding: '16px',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  roomBadge: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: 'var(--jeopardy-gold)',
    background: 'rgba(255,255,255,0.1)',
    padding: '4px 12px',
    borderRadius: '8px',
  },
  phaseBadge: {
    fontSize: '14px',
    color: 'var(--text-light)',
    background: 'rgba(255,255,255,0.05)',
    padding: '4px 12px',
    borderRadius: '8px',
  },
  title: { fontSize: '36px', color: 'var(--jeopardy-gold)', textAlign: 'center', marginBottom: '24px' },
  scores: { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' },
  scoreRow: { fontSize: '24px', color: 'white' },
};
