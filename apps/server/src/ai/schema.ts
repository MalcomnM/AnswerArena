import { z } from 'zod';
import { CLUE_VALUES, CATEGORIES_COUNT, CLUES_PER_CATEGORY } from '@answer-arena/shared';

const clueSchema = z.object({
  value: z.union([
    z.literal(200),
    z.literal(400),
    z.literal(600),
    z.literal(800),
    z.literal(1000),
  ]),
  clue: z.string().min(5).max(500),
  answer: z.string().min(1).max(300),
  acceptable: z.array(z.string()).default([]),
  explanation: z.string().min(1).max(500),
});

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  clues: z
    .array(clueSchema)
    .length(CLUES_PER_CATEGORY)
    .refine(
      (clues) => {
        const values = clues.map(c => c.value).sort((a, b) => a - b);
        return JSON.stringify(values) === JSON.stringify([...CLUE_VALUES]);
      },
      { message: `Each category must have exactly one clue for each value: ${CLUE_VALUES.join(', ')}` },
    ),
});

export const aiBoardSchema = z.object({
  gameTitle: z.string().min(1).max(200),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  categories: z.array(categorySchema).length(CATEGORIES_COUNT),
});

export type ValidatedAiBoard = z.infer<typeof aiBoardSchema>;

export function validateAiBoard(data: unknown): { success: true; data: ValidatedAiBoard } | { success: false; error: string } {
  const result = aiBoardSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ') };
}
