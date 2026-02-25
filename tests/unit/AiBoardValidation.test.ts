import { describe, it, expect } from 'vitest';
import { validateAiBoard } from '../../apps/server/src/ai/schema';

function makeValidBoard() {
  return {
    gameTitle: 'Test Board',
    difficulty: 'medium',
    categories: Array.from({ length: 6 }, (_, ci) => ({
      name: `Category ${ci + 1}`,
      clues: [200, 400, 600, 800, 1000].map(value => ({
        value,
        clue: `This is a clue for value ${value}`,
        answer: `What is the answer for ${value}?`,
        acceptable: ['alt answer'],
        explanation: `Explanation for ${value}`,
      })),
    })),
  };
}

describe('AI Board Validation', () => {
  it('accepts a valid board', () => {
    const board = makeValidBoard();
    const result = validateAiBoard(board);
    expect(result.success).toBe(true);
  });

  it('rejects non-JSON (string)', () => {
    const result = validateAiBoard('not json');
    expect(result.success).toBe(false);
  });

  it('rejects null', () => {
    const result = validateAiBoard(null);
    expect(result.success).toBe(false);
  });

  it('rejects board with fewer than 6 categories', () => {
    const board = makeValidBoard();
    board.categories = board.categories.slice(0, 5);
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('rejects board with more than 6 categories', () => {
    const board = makeValidBoard();
    board.categories.push({
      name: 'Extra',
      clues: [200, 400, 600, 800, 1000].map(value => ({
        value,
        clue: `Clue ${value}`,
        answer: `Answer ${value}`,
        acceptable: [],
        explanation: `Explanation ${value}`,
      })),
    });
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('rejects category with fewer than 5 clues', () => {
    const board = makeValidBoard();
    board.categories[0]!.clues = board.categories[0]!.clues.slice(0, 4);
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('rejects category with more than 5 clues', () => {
    const board = makeValidBoard();
    board.categories[0]!.clues.push({
      value: 200,
      clue: 'Extra',
      answer: 'Extra',
      acceptable: [],
      explanation: 'Extra',
    });
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('rejects duplicate clue values in a category', () => {
    const board = makeValidBoard();
    board.categories[0]!.clues[1]!.value = 200;
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('rejects invalid clue values', () => {
    const board = makeValidBoard();
    (board.categories[0]!.clues[0] as any).value = 300;
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('rejects missing gameTitle', () => {
    const board = makeValidBoard();
    delete (board as any).gameTitle;
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('rejects invalid difficulty', () => {
    const board = makeValidBoard();
    (board as any).difficulty = 'extreme';
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('rejects clue with empty clue text', () => {
    const board = makeValidBoard();
    board.categories[0]!.clues[0]!.clue = 'hi';
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('rejects clue with empty answer', () => {
    const board = makeValidBoard();
    board.categories[0]!.clues[0]!.answer = '';
    const result = validateAiBoard(board);
    expect(result.success).toBe(false);
  });

  it('accepts board with empty acceptable arrays', () => {
    const board = makeValidBoard();
    board.categories[0]!.clues[0]!.acceptable = [];
    const result = validateAiBoard(board);
    expect(result.success).toBe(true);
  });
});
