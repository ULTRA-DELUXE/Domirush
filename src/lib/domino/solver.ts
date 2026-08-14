import {
  areOrthogonallyAdjacent,
  cellKey,
  orthogonalNeighbors,
  rotationForCells,
  sameCell,
} from "./geometry";
import { otherPip } from "./sets";
import type { Cell, DominoTile, PipValue, PlacedTile, PuzzleDefinition } from "./types";

export interface SolverOptions {
  /** Hard ceiling on explored nodes so a pathological board can never hang the UI. */
  maxNodes?: number;
}

export type SolveResult =
  | { status: "solved"; placements: PlacedTile[] }
  | { status: "unsolvable" }
  | { status: "limit-exceeded" };

const DEFAULT_MAX_NODES = 200_000;

function manhattan(a: Cell, b: Cell): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

/**
 * Every tile advances the open end by exactly two orthogonal steps, so the parity of its
 * Manhattan distance to Target is invariant for the whole chain. A win needs that distance to
 * end at 1, so an even Start→Target distance can never be bridged — worth checking up front
 * because it rules out half of all endpoint pairs without any search.
 */
export function hasReachableParity(puzzle: PuzzleDefinition): boolean {
  return manhattan(puzzle.start, puzzle.target) % 2 === 1;
}

function indexTilesByPip(tiles: readonly DominoTile[]): Map<PipValue, DominoTile[]> {
  const index = new Map<PipValue, DominoTile[]>();
  for (const tile of tiles) {
    for (const pip of tile.a === tile.b ? [tile.a] : [tile.a, tile.b]) {
      const bucket = index.get(pip);
      if (bucket) bucket.push(tile);
      else index.set(pip, [tile]);
    }
  }
  return index;
}

/**
 * §4.3 backtracking search: grow a chain outward from Start, one tile at a time, where each new
 * tile's entry half matches the current open value.
 *
 * Runs as iterative deepening over the chain's tile count. That matters because the only strong
 * admissible bound available is "each tile closes at most 2 of the remaining distance" — which
 * is useless against an open-ended search but bites immediately once the tile budget is fixed,
 * pruning the sideways wandering that otherwise dominates the search space.
 */
export function solvePuzzle(puzzle: PuzzleDefinition, options: SolverOptions = {}): SolveResult {
  const maxNodes = options.maxNodes ?? DEFAULT_MAX_NODES;
  if (!hasReachableParity(puzzle)) return { status: "unsolvable" };

  const tilesByPip = indexTilesByPip(puzzle.dominoSet);
  const startDistance = manhattan(puzzle.start, puzzle.target);
  const minTiles = Math.ceil((startDistance - 1) / 2);
  const maxTiles = puzzle.dominoSet.length;

  let nodes = 0;
  let limitHit = false;

  const searchWithBudget = (tileBudget: number): PlacedTile[] | null => {
    const occupied = new Set<string>([cellKey(puzzle.start), cellKey(puzzle.target)]);
    const usedTileIds = new Set<string>();
    const placements: PlacedTile[] = [];

    const toward = (cells: Cell[]): Cell[] =>
      cells.sort((a, b) => manhattan(a, puzzle.target) - manhattan(b, puzzle.target));

    const search = (openCell: Cell, openValue: PipValue): boolean => {
      if (nodes >= maxNodes) {
        limitHit = true;
        return false;
      }
      nodes += 1;

      const tilesLeft = tileBudget - placements.length;
      if (tilesLeft <= 0) return false;
      if (manhattan(openCell, puzzle.target) - 1 > tilesLeft * 2) return false;

      for (const tile of tilesByPip.get(openValue) ?? []) {
        if (usedTileIds.has(tile.id)) continue;
        const exitValue = otherPip(tile, openValue);
        if (exitValue === null) continue;

        for (const entryCell of toward(orthogonalNeighbors(openCell, puzzle.gridSize))) {
          if (occupied.has(cellKey(entryCell))) continue;

          for (const exitCell of toward(orthogonalNeighbors(entryCell, puzzle.gridSize))) {
            if (sameCell(exitCell, openCell) || occupied.has(cellKey(exitCell))) continue;

            // cellA always holds tile.a, so orient the footprint around which half matches.
            const entryIsA = tile.a === openValue;
            const cellA = entryIsA ? entryCell : exitCell;
            const cellB = entryIsA ? exitCell : entryCell;
            const rotation = rotationForCells(cellA, cellB);
            if (rotation === null) continue;

            occupied.add(cellKey(entryCell));
            occupied.add(cellKey(exitCell));
            usedTileIds.add(tile.id);
            placements.push({ tileId: tile.id, cellA, cellB, rotation });

            const reachedTarget =
              areOrthogonallyAdjacent(exitCell, puzzle.target) && exitValue === puzzle.target.value;
            if (reachedTarget || search(exitCell, exitValue)) return true;

            placements.pop();
            usedTileIds.delete(tile.id);
            occupied.delete(cellKey(entryCell));
            occupied.delete(cellKey(exitCell));

            if (limitHit) return false;
          }
        }
      }

      return false;
    };

    // Seeding from the Start marker lets the first level enumerate its neighbours like any other step.
    return search(puzzle.start, puzzle.start.value) ? [...placements] : null;
  };

  for (let tileBudget = Math.max(1, minTiles); tileBudget <= maxTiles; tileBudget += 1) {
    const placements = searchWithBudget(tileBudget);
    if (placements) return { status: "solved", placements };
    if (limitHit) return { status: "limit-exceeded" };
  }

  return { status: "unsolvable" };
}

/**
 * Next-tile hint: the generator already reverse-constructed a known solution, so the hint reads
 * from that rather than re-deriving one at runtime — instant, and it can never fail to find an
 * answer that provably exists.
 */
export function findHintPlacement(
  puzzle: PuzzleDefinition,
  placed: readonly PlacedTile[],
): PlacedTile | null {
  const placedKeys = new Set(
    placed.map((placement) => `${placement.tileId}@${cellKey(placement.cellA)}`),
  );
  for (const placement of puzzle.solution) {
    if (!placedKeys.has(`${placement.tileId}@${cellKey(placement.cellA)}`)) return placement;
  }
  return null;
}
