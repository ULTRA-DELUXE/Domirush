import type { PuzzleDefinition } from "../domino/types";
import type { GameModeId } from "../modes/types";

/**
 * Mode-agnostic session (§7.1). Anything mode-specific — streak length, position, difficulty
 * choice — belongs in `meta`, so adding a mode never widens this shape.
 */
export interface GameSession {
  id: string;
  modeId: GameModeId;
  puzzles: PuzzleDefinition[];
  currentPuzzleIndex: number;
  puzzleTimesMs: number[];
  startedAt: number;
  currentPuzzleStartedAt: number;
  meta: Record<string, unknown>;
}

export interface StreakSessionMeta extends Record<string, unknown> {
  streakLength: number;
  seed: number;
}
