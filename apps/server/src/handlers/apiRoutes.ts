import type { Express } from 'express';
import type { Board, AiBoardResponse } from '@answer-arena/shared';
import { CLUE_VALUES, CATEGORIES_COUNT, CLUES_PER_CATEGORY } from '@answer-arena/shared';
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
      const { roomCode, difficulty, categories, customPrompt } = req.body as {
        roomCode?: string;
        difficulty?: 'easy' | 'medium' | 'hard';
        categories?: string[];
        customPrompt?: string;
      };

      const board = await boardGenerator.generateBoard(difficulty ?? 'medium', categories, customPrompt);

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

  app.put('/api/board/:roomCode', (req, res) => {
    const { board } = req.body as { board?: Board };
    if (!board || !board.categories) {
      res.status(400).json({ error: 'Invalid board data' });
      return;
    }

    if (board.categories.length !== CATEGORIES_COUNT) {
      res.status(400).json({ error: `Board must have exactly ${CATEGORIES_COUNT} categories` });
      return;
    }

    for (const cat of board.categories) {
      if (!cat.name || cat.clues.length !== CLUES_PER_CATEGORY) {
        res.status(400).json({ error: `Each category must have a name and exactly ${CLUES_PER_CATEGORY} clues` });
        return;
      }
      const values = cat.clues.map(c => c.value).sort((a, b) => a - b);
      if (JSON.stringify(values) !== JSON.stringify([...CLUE_VALUES])) {
        res.status(400).json({ error: `Each category must have one clue for each value: ${CLUE_VALUES.join(', ')}` });
        return;
      }
    }

    const room = roomManager.getRoom(req.params.roomCode!);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    const success = roomManager.setBoard(req.params.roomCode!, board);
    if (!success) {
      res.status(500).json({ error: 'Failed to save board' });
      return;
    }

    res.json({ board });
  });
}
