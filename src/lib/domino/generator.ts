import type { DifficultyParams } from "./difficulty";
import {
  GRID_SIZE,
  areOrthogonallyAdjacent,
  cellKey,
  isBorderCell,
  orthogonalNeighbors,
  rotationForCells,
  sameCell,
} from "./geometry";
import { createDominoSet, maxPipForSet, tileIdFor } from "./sets";
import { createRng, randomInt, shuffle, type Rng } from "./rng";
import { solvePuzzle } from "./solver";
import type { Cell, DominoTile, PipValue, PlacedTile, PuzzleDefinition } from "./types";

export class PuzzleGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PuzzleGenerationError";
  }
}

export interface GenerationParams extends DifficultyParams {
  seed: number;
  gridSize?: 8;
  maxAttempts?: number;
}

export interface GeneratedPuzzle {
  puzzle: PuzzleDefinition;
  solution: PlacedTile[];
}

const DEFAULT_MAX_ATTEMPTS = 60;
const PATH_SEARCH_NODE_LIMIT = 40_000;

/**
 * Verification budget. Solvability is already *proved* by construction — the reverse-built
 * solution is stored on the puzzle — so this search only exists to catch a construction bug.
 * A capped search still rejects anything provably unsolvable; exhausting the budget just means
 * "not disproved", which we accept rather than spending seconds re-deriving a known answer.
 */
const VERIFY_NODE_LIMIT = 60_000;

function manhattan(a: Cell, b: Cell): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function borderCells(size: number): Cell[] {
  const cells: Cell[] = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (isBorderCell({ row, col }, size)) cells.push({ row, col });
    }
  }
  return cells;
}

function borderSide(cell: Cell, size: number): string {
  if (cell.row === 0) return "top";
  if (cell.row === size - 1) return "bottom";
  if (cell.col === 0) return "left";
  return "right";
}

function pickEndpoints(
  rng: Rng,
  size: number,
  preferOppositeBorders: boolean,
): { start: Cell; target: Cell } | null {
  const candidates = shuffle(rng, borderCells(size));
  for (const start of candidates) {
    for (const target of candidates) {
      if (sameCell(start, target)) continue;
      const distance = manhattan(start, target);
      // Odd distance is a hard requirement, not a preference — see hasReachableParity().
      if (distance < 3 || distance % 2 === 0) continue;
      const opposite = borderSide(start, size) !== borderSide(target, size);
      if (preferOppositeBorders && !opposite) continue;
      return { start, target };
    }
  }
  return null;
}

/**
 * Self-avoiding orthogonal walk of exactly `length` cells, beginning next to Start and ending
 * next to Target. Pruned on both reachability and parity: every step flips the parity of the
 * remaining Manhattan distance, so an unreachable branch is abandoned before it is explored.
 */
function carveSolutionPath(
  rng: Rng,
  size: number,
  start: Cell,
  target: Cell,
  length: number,
): Cell[] | null {
  const blocked = new Set<string>([cellKey(start), cellKey(target)]);
  const visited = new Set<string>();
  const path: Cell[] = [];
  let nodes = 0;

  const step = (cell: Cell): boolean => {
    if (nodes >= PATH_SEARCH_NODE_LIMIT) return false;
    nodes += 1;

    path.push(cell);
    visited.add(cellKey(cell));

    if (path.length === length) {
      if (areOrthogonallyAdjacent(cell, target)) return true;
      path.pop();
      visited.delete(cellKey(cell));
      return false;
    }

    const remaining = length - path.length;
    for (const next of shuffle(rng, orthogonalNeighbors(cell, size))) {
      const key = cellKey(next);
      if (visited.has(key) || blocked.has(key)) continue;
      const distanceToGoal = manhattan(next, target) - 1;
      const stepsLeftAfterNext = remaining - 1;
      if (distanceToGoal > stepsLeftAfterNext) continue;
      if ((stepsLeftAfterNext - distanceToGoal) % 2 !== 0) continue;
      if (step(next)) return true;
    }

    path.pop();
    visited.delete(cellKey(cell));
    return false;
  };

  for (const first of shuffle(rng, orthogonalNeighbors(start, size))) {
    if (blocked.has(cellKey(first))) continue;
    const distanceToGoal = manhattan(first, target) - 1;
    const stepsLeftAfterFirst = length - 1;
    if (distanceToGoal > stepsLeftAfterFirst) continue;
    if ((stepsLeftAfterFirst - distanceToGoal) % 2 !== 0) continue;
    if (step(first)) return [...path];
  }
  return null;
}

/**
 * Labels the path as a domino trail: consecutive cell pairs become tiles, and each tile's exit
 * value is the next tile's entry value. Backtracks because a greedy walk can strand itself on a
 * value whose remaining dominoes are all spent.
 */
function buildDominoTrail(rng: Rng, maxPip: number, tileCount: number): PipValue[] | null {
  const usedTileIds = new Set<string>();
  const values: PipValue[] = [];

  const extend = (current: PipValue): boolean => {
    if (values.length === tileCount + 1) return true;
    for (const next of shuffle(rng, Array.from({ length: maxPip + 1 }, (_, i) => i))) {
      const id = tileIdFor(current, next);
      if (usedTileIds.has(id)) continue;
      usedTileIds.add(id);
      values.push(next);
      if (extend(next)) return true;
      values.pop();
      usedTileIds.delete(id);
    }
    return false;
  };

  for (const seedValue of shuffle(rng, Array.from({ length: maxPip + 1 }, (_, i) => i))) {
    values.length = 0;
    usedTileIds.clear();
    values.push(seedValue);
    if (extend(seedValue)) return [...values];
  }
  return null;
}

function buildSolutionPlacements(
  path: Cell[],
  trail: PipValue[],
  tilesById: Map<string, DominoTile>,
): PlacedTile[] | null {
  const placements: PlacedTile[] = [];
  for (let i = 0; i * 2 + 1 < path.length; i += 1) {
    const entryCell = path[i * 2];
    const exitCell = path[i * 2 + 1];
    const entryValue = trail[i];
    const exitValue = trail[i + 1];
    const tile = tilesById.get(tileIdFor(entryValue, exitValue));
    if (!tile) return null;

    // cellA must hold tile.a, which is the lower pip after set normalisation.
    const entryIsA = tile.a === entryValue;
    const cellA = entryIsA ? entryCell : exitCell;
    const cellB = entryIsA ? exitCell : entryCell;
    const rotation = rotationForCells(cellA, cellB);
    if (rotation === null) return null;
    placements.push({ tileId: tile.id, cellA, cellB, rotation });
  }
  return placements;
}

export function generatePuzzle(params: GenerationParams): GeneratedPuzzle {
  const size = params.gridSize ?? GRID_SIZE;
  const maxAttempts = params.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const fullSet = createDominoSet(params.setId);
  const tilesById = new Map(fullSet.map((tile) => [tile.id, tile]));
  const maxPip = maxPipForSet(params.setId);

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const rng = createRng(params.seed + attempt * 7919);

    const endpoints = pickEndpoints(rng, size, params.preferOppositeBorders);
    if (!endpoints) continue;

    const tileCount = randomInt(rng, params.minPathTiles, params.maxPathTiles);
    const path = carveSolutionPath(rng, size, endpoints.start, endpoints.target, tileCount * 2);
    if (!path) continue;

    const trail = buildDominoTrail(rng, maxPip, tileCount);
    if (!trail) continue;

    const solution = buildSolutionPlacements(path, trail, tilesById);
    if (!solution) continue;

    const solutionTileIds = new Set(solution.map((placement) => placement.tileId));
    const distractorPool = shuffle(
      rng,
      fullSet.filter((tile) => !solutionTileIds.has(tile.id)),
    );
    const distractorCount = Math.min(
      distractorPool.length,
      randomInt(rng, params.minDistractors, params.maxDistractors),
    );
    const tray = shuffle(rng, [
      ...solution.map((placement) => tilesById.get(placement.tileId)!),
      ...distractorPool.slice(0, distractorCount),
    ]);

    const puzzle: PuzzleDefinition = {
      id: `${params.setId}-${params.seed}-${attempt}`,
      gridSize: 8,
      setId: params.setId,
      start: { ...endpoints.start, value: trail[0] },
      target: { ...endpoints.target, value: trail[trail.length - 1] },
      dominoSet: tray,
      solutionTileIds: solution.map((placement) => placement.tileId),
      solution,
    };

    // §4.1 step 6 — no unsolvable puzzle may ever reach a player.
    const verification = solvePuzzle(puzzle, { maxNodes: VERIFY_NODE_LIMIT });
    if (verification.status === "unsolvable") continue;

    return { puzzle, solution };
  }

  throw new PuzzleGenerationError(
    `Could not generate a solvable puzzle after ${maxAttempts} attempts.`,
  );
}
