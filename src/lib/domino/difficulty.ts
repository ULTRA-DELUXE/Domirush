import type { DominoSetId } from "./types";

export interface DifficultyParams {
  setId: DominoSetId;
  minPathTiles: number;
  maxPathTiles: number;
  minDistractors: number;
  maxDistractors: number;
  /** Endpoints on the same border are easier to bridge than opposite ones. */
  preferOppositeBorders: boolean;
}

/**
 * §4.2 difficulty curve, keyed by 1-based position within a streak.
 * Placeholder bands for Alpha — tuned from playtesting in Beta (§14).
 */
export function getDifficultyForPosition(position: number): DifficultyParams {
  if (position <= 2) {
    return {
      setId: "double-six",
      minPathTiles: 4,
      maxPathTiles: 6,
      minDistractors: 2,
      maxDistractors: 4,
      preferOppositeBorders: false,
    };
  }
  if (position <= 5) {
    return {
      setId: "double-six",
      minPathTiles: 6,
      maxPathTiles: 9,
      minDistractors: 4,
      maxDistractors: 6,
      preferOppositeBorders: false,
    };
  }
  if (position <= 10) {
    return {
      setId: "double-eight",
      minPathTiles: 8,
      maxPathTiles: 12,
      minDistractors: 6,
      maxDistractors: 10,
      preferOppositeBorders: true,
    };
  }
  return {
    setId: "double-nine",
    minPathTiles: 10,
    maxPathTiles: 15,
    minDistractors: 8,
    maxDistractors: 12,
    preferOppositeBorders: true,
  };
}
