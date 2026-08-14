import { describe, expect, it } from "vitest";
import { generatePuzzle } from "@/lib/domino/generator";
import { getDifficultyForPosition } from "@/lib/domino/difficulty";
import { findHintPlacement, hasReachableParity, solvePuzzle } from "@/lib/domino/solver";
import { createDominoSet } from "@/lib/domino/sets";
import {
  areOrthogonallyAdjacent,
  cellKey,
  isBorderCell,
  isInBounds,
} from "@/lib/domino/geometry";
import { indexTiles, isPuzzleSolved } from "@/lib/domino/validator";
import type { PuzzleDefinition } from "@/lib/domino/types";

function generateAt(position: number, seed: number) {
  return generatePuzzle({ ...getDifficultyForPosition(position), seed });
}

describe("puzzle generation", () => {
  it("produces a puzzle whose built-in solution actually wins", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const { puzzle, solution } = generateAt(3, seed);
      expect(isPuzzleSolved(puzzle, solution, indexTiles(puzzle.dominoSet))).toBe(true);
    }
  });

  it("is solver-verified across the whole difficulty curve", () => {
    for (const position of [1, 3, 7, 12]) {
      const { puzzle } = generateAt(position, position * 101);
      expect(solvePuzzle(puzzle).status).not.toBe("unsolvable");
    }
  });

  it("places Start and Target on the border as distinct cells", () => {
    const { puzzle } = generateAt(5, 42);
    expect(isBorderCell(puzzle.start)).toBe(true);
    expect(isBorderCell(puzzle.target)).toBe(true);
    expect(cellKey(puzzle.start)).not.toBe(cellKey(puzzle.target));
  });

  it("keeps every solution tile on the grid, orthogonal and non-overlapping", () => {
    const { puzzle, solution } = generateAt(8, 77);
    const seen = new Set<string>();
    for (const placement of solution) {
      expect(isInBounds(placement.cellA)).toBe(true);
      expect(isInBounds(placement.cellB)).toBe(true);
      expect(areOrthogonallyAdjacent(placement.cellA, placement.cellB)).toBe(true);
      for (const cell of [placement.cellA, placement.cellB]) {
        expect(seen.has(cellKey(cell))).toBe(false);
        seen.add(cellKey(cell));
        expect(cellKey(cell)).not.toBe(cellKey(puzzle.start));
        expect(cellKey(cell)).not.toBe(cellKey(puzzle.target));
      }
    }
  });

  it("uses each domino at most once and mixes in distractors", () => {
    const { puzzle } = generateAt(6, 9001);
    const ids = puzzle.dominoSet.map((tile) => tile.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(puzzle.dominoSet.length).toBeGreaterThan(puzzle.solutionTileIds.length);
  });

  it("respects the difficulty band for the streak position", () => {
    const band = getDifficultyForPosition(1);
    const { puzzle, solution } = generateAt(1, 5);
    expect(puzzle.setId).toBe(band.setId);
    expect(solution.length).toBeGreaterThanOrEqual(band.minPathTiles);
    expect(solution.length).toBeLessThanOrEqual(band.maxPathTiles);
  });

  it("is deterministic for a given seed", () => {
    const first = generateAt(4, 12345).puzzle;
    const second = generateAt(4, 12345).puzzle;
    expect(second).toEqual(first);
  });
});

describe("solver", () => {
  it("finds a chain that the validator agrees is a win", () => {
    const { puzzle } = generateAt(2, 314);
    const result = solvePuzzle(puzzle);
    expect(result.status).toBe("solved");
    if (result.status !== "solved") return;
    expect(isPuzzleSolved(puzzle, result.placements, indexTiles(puzzle.dominoSet))).toBe(true);
  });

  it("rejects endpoints whose distance parity can never be bridged", () => {
    const evenDistance: PuzzleDefinition = {
      id: "even",
      gridSize: 8,
      setId: "double-six",
      start: { row: 0, col: 0, value: 3 },
      target: { row: 0, col: 2, value: 5 },
      dominoSet: createDominoSet("double-six"),
      solutionTileIds: [],
      solution: [],
    };
    expect(hasReachableParity(evenDistance)).toBe(false);
    expect(solvePuzzle(evenDistance).status).toBe("unsolvable");
  });

  it("only ever generates endpoints with bridgeable parity", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      expect(hasReachableParity(generateAt(4, seed).puzzle)).toBe(true);
    }
  });

  it("suggests a hint that belongs to a real solution", () => {
    const { puzzle } = generateAt(2, 555);
    const hint = findHintPlacement(puzzle, []);
    expect(hint).not.toBeNull();
    expect(puzzle.dominoSet.some((tile) => tile.id === hint!.tileId)).toBe(true);
  });

  it("reports unsolvable when the tray cannot reach Target", () => {
    const result = solvePuzzle({
      id: "dead-end",
      gridSize: 8,
      setId: "double-six",
      start: { row: 0, col: 0, value: 3 },
      target: { row: 0, col: 3, value: 5 },
      dominoSet: [{ id: "1-2", a: 1, b: 2 }],
      solutionTileIds: [],
      solution: [],
    });
    expect(result.status).toBe("unsolvable");
  });
});
