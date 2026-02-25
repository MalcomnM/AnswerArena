import type { Express } from 'express';
import type { Board, AiBoardResponse } from '@answer-arena/shared';
import { RoomManager } from '../modules/RoomManager.js';
import { AiBoardGenerator } from '../ai/AiBoardGenerator.js';
import { SAMPLE_BOARD } from '../ai/sampleBoard.js';

function sampleToBoard(sample: AiBoardResponse): Board {
  return {
    categories: sample.categories.map(cat => ({
      name: cat.name,
      clues: cat.clues
        .sort((a, b) => a.value - b.value)
        .map(clue => ({ ...clue, used: false })),
    })),
  };
}

export function registerApiRoutes(app: Express, roomManager: RoomManager): void {
  const boardGenerator = new AiBoardGenerator();

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.post('/api/board/generate', async (req, res) => {
    try {
      const { roomCode, difficulty, categories } = req.body as {
        roomCode?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        categories?: string[];
      };

      const board = await boardGenerator.generateBoard(difficulty ?? 'medium', categories);

      if (roomCode) {
        const success = roomManager.setBoard(roomCode, board);
        if (!success) {
          res.status(404).json({ error: 'Room not found' });
          return;
        }
      }

      res.json({ board });
    } catch (err) {
      console.error('Board generation failed:', err);
      res.status(500).json({ error: 'Board generation failed' });
    }
  });

  app.post('/api/board/sample', (req, res) => {
    const { roomCode } = req.body as { roomCode?: string };
    const board = sampleToBoard(SAMPLE_BOARD);

    if (roomCode) {
      roomManager.setBoard(roomCode, board);
    }

    res.json({ board });
  });

  app.get('/api/board/:roomCode', (req, res) => {
    const room = roomManager.getRoom(req.params.roomCode!);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    if (!room.board) {
      res.status(404).json({ error: 'No board loaded' });
      return;
    }
    res.json({ board: room.board });
  });
}
