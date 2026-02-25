import type { Board, AiBoardResponse } from '@answer-arena/shared';
import { OpenRouterClient } from './OpenRouterClient.js';
import { validateAiBoard } from './schema.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompts.js';
import { SAMPLE_BOARD } from './sampleBoard.js';

export class AiBoardGenerator {
  private client: OpenRouterClient;

  constructor(client?: OpenRouterClient) {
    this.client = client ?? new OpenRouterClient();
  }

  async generateBoard(
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    categories?: string[],
  ): Promise<Board> {
    const userPrompt = buildUserPrompt(difficulty, categories);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const raw = await this.client.generate(SYSTEM_PROMPT, userPrompt);
        const parsed = JSON.parse(raw);
        const validation = validateAiBoard(parsed);

        if (validation.success) {
          return this.toBoard(validation.data);
        }

        console.warn(`AI board validation failed (attempt ${attempt + 1}):`, validation.error);
      } catch (err) {
        console.warn(`AI board generation failed (attempt ${attempt + 1}):`, err);
      }
    }

    console.warn('Falling back to sample board');
    return this.toBoard(SAMPLE_BOARD);
  }

  private toBoard(aiBoard: AiBoardResponse): Board {
    return {
      categories: aiBoard.categories.map(cat => ({
        name: cat.name,
        clues: cat.clues
          .sort((a, b) => a.value - b.value)
          .map(clue => ({
            ...clue,
            used: false,
          })),
      })),
    };
  }
}
