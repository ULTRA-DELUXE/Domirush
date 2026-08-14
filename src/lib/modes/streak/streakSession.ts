import { getDifficultyForPosition } from "../../domino/difficulty";
import { generatePuzzle } from "../../domino/generator";
import type { PuzzleDefinition } from "../../domino/types";

/**
 * Builds a streak's full puzzle queue up front (`preloaded-finite`), ramping difficulty by
 * position per §4.2. Each puzzle gets its own derived seed so a session is reproducible.
 */
export function buildStreakPuzzles(streakLength: number, seed: number): PuzzleDefinition[] {
  const puzzles: PuzzleDefinition[] = [];
  for (let position = 1; position <= streakLength; position += 1) {
    const difficulty = getDifficultyForPosition(position);
    puzzles.push(generatePuzzle({ ...difficulty, seed: seed + position * 104_729 }).puzzle);
  }
  return puzzles;
}
