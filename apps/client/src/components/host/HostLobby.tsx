import { useState, useEffect, useCallback } from 'react';
import type { Player, Board } from '@answer-arena/shared';
import { BoardPreview } from './BoardPreview';

interface Props {
  roomCode: string;
  hostPin: string;
  players: Player[];
  onStartGame: () => void;
  boardLoaded: boolean;
}

export function HostLobby({ roomCode, hostPin, players, onStartGame, boardLoaded }: Props) {
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [activeTab, setActiveTab] = useState<'board' | 'players'>('board');

  useEffect(() => {
    if (boardLoaded && !board) {
      fetchBoard();
    }
  }, [boardLoaded]);

  const fetchBoard = async () => {
    try {
      const res = await fetch(`/api/board/${roomCode}`);
      if (res.ok) {
        const data = await res.json();
        setBoard(data.board);
      }
    } catch (err) {
      console.error('Failed to fetch board:', err);
    }
  };

  const loadSampleBoard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/board/sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode }),
      });
      if (res.ok) {
        const data = await res.json();
        setBoard(data.board);
      }
    } catch (err) {
      console.error('Failed to load board:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAiBoard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/board/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, difficulty: 'medium' }),
      });
      if (res.ok) {
        const data = await res.json();
        setBoard(data.board);
      }
    } catch (err) {
      console.error('Failed to generate board:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/board/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, difficulty: 'medium' }),
      });
      if (res.ok) {
        const data = await res.json();
        setBoard(data.board);
      }
    } catch (err) {
      console.error('Failed to regenerate:', err);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  const handleRegenerateCategory = useCallback(async (_categoryIndex: number) => {
    // For MVP, regenerate the whole board; per-category regeneration is a stretch goal
    await handleRegenerate();
  }, [handleRegenerate]);

  const boardReady = !!board;

  return (
    <div style={styles.container}>
      {/* Header with room code + PIN */}
      <div style={styles.headerSection}>
        <h2 style={styles.title}>Lobby</h2>
        <div style={styles.codeSection}>
          <p style={styles.label}>Room Code</p>
          <p style={styles.code} data-testid="host-room-code">{roomCode}</p>
          <p style={styles.instruction}>
            TV: <strong>/board?room={roomCode}</strong> &nbsp;|&nbsp;
            Players: <strong>/play</strong>
          </p>
        </div>
        <button style={styles.pinBtn} onClick={() => setShowPin(!showPin)}>
          {showPin ? `Host PIN: ${hostPin}` : 'Show Host PIN'}
        </button>
      </div>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'board' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('board')}
        >
          Board {boardReady ? '✓' : ''}
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'players' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('players')}
        >
          Players ({players.length})
        </button>
      </div>

      {/* Board tab */}
      {activeTab === 'board' && (
        <div style={styles.tabContent}>
          {!boardReady ? (
            <div style={styles.boardActions}>
              <p style={styles.boardHint}>Load a board to review questions before starting.</p>
              <button
                style={styles.actionBtn}
                onClick={loadSampleBoard}
                disabled={loading}
                data-testid="load-sample-board"
              >
                {loading ? 'Loading...' : 'Load Sample Board'}
              </button>
              <button
                style={{ ...styles.actionBtn, background: 'var(--correct-green)' }}
                onClick={generateAiBoard}
                disabled={loading}
                data-testid="generate-ai-board"
              >
                {loading ? 'Generating...' : 'Generate AI Board'}
              </button>
            </div>
          ) : (
            <BoardPreview
              board={board!}
              roomCode={roomCode}
              onRegenerate={handleRegenerate}
              onRegenerateCategory={handleRegenerateCategory}
              loading={loading}
            />
          )}
        </div>
      )}

      {/* Players tab */}
      {activeTab === 'players' && (
        <div style={styles.tabContent}>
          <div style={styles.playerSection}>
            {players.length === 0 && <p style={styles.waiting}>Waiting for players to join...</p>}
            {players.map(p => (
              <div key={p.id} style={styles.playerRow} data-testid="lobby-player">
                <span style={styles.playerDot}>●</span>
                <span>{p.displayName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Game button (always visible at bottom) */}
      <div style={styles.footer}>
        {!boardReady && <p style={styles.footerHint}>Load a board first</p>}
        {boardReady && players.length === 0 && <p style={styles.footerHint}>Waiting for players...</p>}
        <button
          style={{
            ...styles.startBtn,
            opacity: players.length > 0 && boardReady ? 1 : 0.4,
          }}
          onClick={onStartGame}
          disabled={players.length === 0 || !boardReady}
          data-testid="start-game-btn"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'var(--bg-dark)',
    overflow: 'hidden',
  },
  headerSection: {
    padding: '16px 20px 12px',
    textAlign: 'center',
    flexShrink: 0,
  },
  title: { fontSize: '24px', color: 'var(--jeopardy-gold)', margin: '0 0 8px 0' },
  codeSection: { marginBottom: '8px' },
  label: { fontSize: '12px', color: 'var(--text-light)', margin: 0 },
  code: { fontSize: '36px', fontWeight: 'bold', color: 'var(--jeopardy-gold)', letterSpacing: '6px', margin: '2px 0' },
  instruction: { fontSize: '12px', color: 'var(--text-light)', margin: 0 },
  pinBtn: {
    fontSize: '12px', padding: '6px 14px', borderRadius: '8px',
    background: 'rgba(255,255,255,0.08)', color: 'var(--text-light)',
  },
  tabBar: {
    display: 'flex',
    borderBottom: '2px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  tab: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'var(--text-light)',
    background: 'transparent',
    textAlign: 'center',
    opacity: 0.6,
  },
  tabActive: {
    opacity: 1,
    color: 'var(--jeopardy-gold)',
    borderBottom: '2px solid var(--jeopardy-gold)',
    marginBottom: '-2px',
  },
  tabContent: {
    flex: 1,
    overflow: 'auto',
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  boardActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  boardHint: { fontSize: '16px', color: 'var(--text-light)', textAlign: 'center', maxWidth: '300px' },
  actionBtn: {
    fontSize: '18px', padding: '14px 32px', borderRadius: '12px',
    background: 'var(--jeopardy-blue)', color: 'white', fontWeight: 'bold', minWidth: '260px',
  },
  playerSection: { width: '100%', maxWidth: '400px' },
  waiting: { fontSize: '16px', color: 'var(--text-light)', opacity: 0.6, textAlign: 'center' },
  playerRow: {
    display: 'flex', gap: '8px', alignItems: 'center', fontSize: '18px', color: 'white',
    padding: '10px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px',
  },
  playerDot: { color: 'var(--correct-green)', fontSize: '12px' },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  footerHint: { fontSize: '14px', color: 'var(--text-light)', opacity: 0.6, margin: 0 },
  startBtn: {
    fontSize: '22px', padding: '16px 48px', borderRadius: '16px',
    background: 'var(--correct-green)', color: 'white', fontWeight: 'bold',
    width: '100%', maxWidth: '400px',
  },
};
