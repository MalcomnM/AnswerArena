export const CLUE_VALUES = [200, 400, 600, 800, 1000] as const;
export type ClueValue = (typeof CLUE_VALUES)[number];

export const CATEGORIES_COUNT = 6;
export const CLUES_PER_CATEGORY = 5;
export const DEFAULT_TIMER_MS = 25_000;
export const ROOM_CODE_LENGTH = 5;
export const HOST_PIN_LENGTH = 6;
export const ROOM_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours
export const MAX_PLAYERS = 12;
export const MIN_PLAYERS = 1;
