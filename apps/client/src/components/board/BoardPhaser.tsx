import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BoardScene } from '../../phaser/scenes/BoardScene';
import type {
  PublicBoard,
  ClueRevealedPayload,
  ClueSelectedPayload,
  BuzzerWinnerPayload,
  JudgeResultPayload,
  GamePhase,
} from '@answer-arena/shared';

interface Props {
  board: PublicBoard | null;
  revealedClue: ClueRevealedPayload | null;
  selectedClue: ClueSelectedPayload | null;
  buzzerWinner: BuzzerWinnerPayload | null;
  judgeResult: JudgeResultPayload | null;
  phase: GamePhase;
  buzzerTimerMs: number;
  buzzerDurationMs: number;
  judgingTimerMs: number;
  revealedAnswer: string | null;
}

export function BoardPhaser({ board, revealedClue, selectedClue, buzzerWinner, judgeResult, phase, buzzerTimerMs, buzzerDurationMs, judgingTimerMs, revealedAnswer }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<BoardScene | null>(null);
  const boardRef = useRef<PublicBoard | null>(board);
  boardRef.current = board;

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight - 60,
      backgroundColor: '#060CE9',
      scene: BoardScene,
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.on('ready', () => {
      const scene = game.scene.getScene('BoardScene') as BoardScene;
      sceneRef.current = scene;
      scene.updateBoard(boardRef.current);
    });

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current ?? (gameRef.current?.scene.getScene('BoardScene') as BoardScene | undefined);
    if (scene) {
      scene.updateBoard(board);
    }
  }, [board]);

  useEffect(() => {
    const scene = sceneRef.current ?? (gameRef.current?.scene.getScene('BoardScene') as BoardScene | undefined);
    if (!scene) return;

    if (revealedClue) {
      scene.showClueReveal(revealedClue.clueText, revealedClue.value);
    } else if (phase === 'BOARD') {
      scene.hideClueReveal();
    }
  }, [revealedClue, phase]);

  useEffect(() => {
    const scene = sceneRef.current ?? (gameRef.current?.scene.getScene('BoardScene') as BoardScene | undefined);
    if (scene && buzzerTimerMs > 0 && buzzerDurationMs > 0) {
      scene.startTimer(buzzerDurationMs);
      scene.syncTimer(buzzerTimerMs);
    }
  }, [buzzerTimerMs, buzzerDurationMs]);

  useEffect(() => {
    const scene = sceneRef.current ?? (gameRef.current?.scene.getScene('BoardScene') as BoardScene | undefined);
    if (!scene) return;
    if (judgingTimerMs > 0) {
      scene.startJudgingTimer(judgingTimerMs);
    } else if (phase !== 'BUZZING_OPEN') {
      scene.stopJudgingTimer();
    }
  }, [judgingTimerMs, phase]);

  useEffect(() => {
    const scene = sceneRef.current ?? (gameRef.current?.scene.getScene('BoardScene') as BoardScene | undefined);
    if (scene && buzzerWinner) {
      scene.showBuzzerWinner(buzzerWinner.displayName);
    }
  }, [buzzerWinner]);

  useEffect(() => {
    const scene = sceneRef.current ?? (gameRef.current?.scene.getScene('BoardScene') as BoardScene | undefined);
    if (scene && judgeResult) {
      scene.showJudgeResult(judgeResult.correct);
    }
  }, [judgeResult]);

  useEffect(() => {
    const scene = sceneRef.current ?? (gameRef.current?.scene.getScene('BoardScene') as BoardScene | undefined);
    if (scene && revealedAnswer) {
      scene.showAnswer(revealedAnswer);
    }
  }, [revealedAnswer]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: 'calc(100vh - 60px)' }}
      data-testid="phaser-board"
    />
  );
}
