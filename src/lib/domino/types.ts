export type PipValue = number; // 0..9 depending on active set

export interface Cell {
  row: number;
  col: number;
}

/**
 * Placement model: 90° rotation, cell-exact halves (4 orientations).
 * Rotation is the clockwise angle from "half A left, half B right".
 *
 * Resolved vs the v0.7.0 proposal's 45°/8-way note: generator, solver, validator, and UI
 * all use orthogonal adjacency only. Diagonal / king-move placement is not in this game.
 */
export type Rotation = 0 | 90 | 180 | 270;

export interface DominoTile {
  id: string;
  a: PipValue;
  b: PipValue;
}

export interface PlacedTile {
  tileId: string;
  cellA: Cell;
  cellB: Cell;
  rotation: Rotation;
}

export type DominoSetId = "double-six" | "double-eight" | "double-nine";

export interface EndpointMarker extends Cell {
  value: PipValue;
}

export interface PuzzleDefinition {
  id: string;
  gridSize: 8;
  setId: DominoSetId;
  start: EndpointMarker;
  target: EndpointMarker;
  dominoSet: DominoTile[]; // full tray for this puzzle (solution tiles + distractors)
  solutionTileIds: string[]; // for validation/hints, not shown to player
  /** The reverse-constructed solution the generator built the puzzle from — backs hints. */
  solution: PlacedTile[];
}
