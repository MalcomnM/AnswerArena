import type { ClueValue } from '../constants.js';

export interface ClueData {
  value: ClueValue;
  clue: string;
  answer: string;
  acceptable: string[];
  explanation: string;
  used: boolean;
}

export interface Category {
  name: string;
  clues: ClueData[];
}

export interface Board {
  categories: Category[];
}

export interface BoardGenerationRequest {
  categories?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  customPrompt?: string;
}

export interface AiBoardResponse {
  gameTitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  categories: {
    name: string;
    clues: {
      value: ClueValue;
      clue: string;
      answer: string;
      acceptable: string[];
      explanation: string;
    }[];
  }[];
}
