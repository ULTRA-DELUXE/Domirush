import {
  areOrthogonallyAdjacent,
  cellKey,
  footprintForAnchor,
  orthogonalNeighbors,
  sameCell,
} from "./geometry";
import type { Cell, DominoTile, PipValue, PlacedTile, PuzzleDefinition, Rotation } from "./types";

export interface HalfOccupant {
  tileId: string;
  cell: Cell;
  pip: PipValue;
  half: "a" | "b";
}

export type Occupancy = Map<string, HalfOccupant>;

export type PlacementRejection = "out-of-bounds" | "occupied" | "endpoint-cell";

export type PlacementCheck =
  | { ok: true; cellA: Cell; cellB: Cell }
  | { ok: false; reason: PlacementRejection };

export interface Junction {
  cellA: Cell;
  cellB: Cell;
  match: boolean;
  kind: "tile-tile" | "marker-tile";
}

export interface ChainTrace {
  /** Tiles in traversal order from Start. */
  tileIds: string[];
  /** Cells in traversal order, two per tile (entry half then exit half). */
  cells: Cell[];
  complete: boolean;
}

export function indexTiles(tiles: readonly DominoTile[]): Map<string, DominoTile> {
  return new Map(tiles.map((tile) => [tile.id, tile]));
}

export function buildOccupancy(
  placed: readonly PlacedTile[],
  tilesById: Map<string, DominoTile>,
): Occupancy {
  const occupancy: Occupancy = new Map();
  for (const placement of placed) {
    const tile = tilesById.get(placement.tileId);
    if (!tile) continue;
    occupancy.set(cellKey(placement.cellA), {
      tileId: tile.id,
      cell: placement.cellA,
      pip: tile.a,
      half: "a",
    });
    occupancy.set(cellKey(placement.cellB), {
      tileId: tile.id,
      cell: placement.cellB,
      pip: tile.b,
      half: "b",
    });
  }
  return occupancy;
}

function isEndpointCell(puzzle: PuzzleDefinition, cell: Cell): boolean {
  return sameCell(cell, puzzle.start) || sameCell(cell, puzzle.target);
}

/**
 * Geometric legality only. Mismatched pip values are deliberately *not* rejected here —
 * §2.4 allows invalid layouts and flags them instead of blocking the drop.
 */
export function checkPlacement(
  puzzle: PuzzleDefinition,
  occupancy: Occupancy,
  anchor: Cell,
  rotation: Rotation,
  ignoreTileId?: string,
): PlacementCheck {
  const footprint = footprintForAnchor(anchor, rotation, puzzle.gridSize);
  if (!footprint) return { ok: false, reason: "out-of-bounds" };

  for (const cell of [footprint.cellA, footprint.cellB]) {
    if (isEndpointCell(puzzle, cell)) return { ok: false, reason: "endpoint-cell" };
    const occupant = occupancy.get(cellKey(cell));
    if (occupant && occupant.tileId !== ignoreTileId) return { ok: false, reason: "occupied" };
  }

  return { ok: true, cellA: footprint.cellA, cellB: footprint.cellB };
}

export function getJunctions(puzzle: PuzzleDefinition, occupancy: Occupancy): Junction[] {
  const junctions: Junction[] = [];
  const seen = new Set<string>();

  for (const occupant of occupancy.values()) {
    for (const neighborCell of orthogonalNeighbors(occupant.cell, puzzle.gridSize)) {
      const neighbor = occupancy.get(cellKey(neighborCell));
      if (!neighbor || neighbor.tileId === occupant.tileId) continue;
      const pairKey = [cellKey(occupant.cell), cellKey(neighborCell)].sort().join("|");
      if (seen.has(pairKey)) continue;
      seen.add(pairKey);
      junctions.push({
        cellA: occupant.cell,
        cellB: neighbor.cell,
        match: occupant.pip === neighbor.pip,
        kind: "tile-tile",
      });
    }
  }

  for (const marker of [puzzle.start, puzzle.target]) {
    for (const neighborCell of orthogonalNeighbors(marker, puzzle.gridSize)) {
      const neighbor = occupancy.get(cellKey(neighborCell));
      if (!neighbor) continue;
      junctions.push({
        cellA: { row: marker.row, col: marker.col },
        cellB: neighbor.cell,
        match: neighbor.pip === marker.value,
        kind: "marker-tile",
      });
    }
  }

  return junctions;
}

function otherHalfOf(placement: PlacedTile, cell: Cell): Cell {
  return sameCell(placement.cellA, cell) ? placement.cellB : placement.cellA;
}

/**
 * Walks the chain outward from Start, hopping tile-to-tile through matching junctions.
 * Returns the completed chain when Target is reached, otherwise the longest partial chain
 * found — that partial is what the "Check Path" affordance highlights (§2.4).
 */
export function traceChain(
  puzzle: PuzzleDefinition,
  placed: readonly PlacedTile[],
  tilesById: Map<string, DominoTile>,
): ChainTrace {
  const occupancy = buildOccupancy(placed, tilesById);
  const placementByTileId = new Map(placed.map((placement) => [placement.tileId, placement]));

  let best: ChainTrace = { tileIds: [], cells: [], complete: false };

  const visit = (
    entryCell: Cell,
    visitedTileIds: string[],
    visitedCells: Cell[],
  ): ChainTrace | null => {
    const entry = occupancy.get(cellKey(entryCell));
    if (!entry) return null;
    const placement = placementByTileId.get(entry.tileId);
    if (!placement) return null;

    const exitCell = otherHalfOf(placement, entryCell);
    const exit = occupancy.get(cellKey(exitCell));
    if (!exit) return null;

    const tileIds = [...visitedTileIds, entry.tileId];
    const cells = [...visitedCells, entryCell, exitCell];

    if (cells.length > best.cells.length) best = { tileIds, cells, complete: false };

    if (areOrthogonallyAdjacent(exitCell, puzzle.target) && exit.pip === puzzle.target.value) {
      return { tileIds, cells, complete: true };
    }

    for (const nextCell of orthogonalNeighbors(exitCell, puzzle.gridSize)) {
      const next = occupancy.get(cellKey(nextCell));
      if (!next || next.tileId === entry.tileId) continue;
      if (tileIds.includes(next.tileId)) continue;
      if (next.pip !== exit.pip) continue;
      const found = visit(nextCell, tileIds, cells);
      if (found?.complete) return found;
    }

    return null;
  };

  for (const startNeighbor of orthogonalNeighbors(puzzle.start, puzzle.gridSize)) {
    const occupant = occupancy.get(cellKey(startNeighbor));
    if (!occupant || occupant.pip !== puzzle.start.value) continue;
    const found = visit(startNeighbor, [], []);
    if (found?.complete) return found;
  }

  return best;
}

export function isPuzzleSolved(
  puzzle: PuzzleDefinition,
  placed: readonly PlacedTile[],
  tilesById: Map<string, DominoTile>,
): boolean {
  return traceChain(puzzle, placed, tilesById).complete;
}
