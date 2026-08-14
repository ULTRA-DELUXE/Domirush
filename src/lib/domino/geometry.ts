import type { Cell, Rotation } from "./types";

export const GRID_SIZE = 8;

export const ROTATIONS: readonly Rotation[] = [0, 90, 180, 270];

/** Offset from cellA to cellB for each rotation. Rotation increases clockwise on screen (y grows downward). */
const ROTATION_OFFSETS: Record<Rotation, Cell> = {
  0: { row: 0, col: 1 },
  90: { row: 1, col: 0 },
  180: { row: 0, col: -1 },
  270: { row: -1, col: 0 },
};

const ORTHOGONAL_STEPS: readonly Cell[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

export function cellKey(cell: Cell): string {
  return `${cell.row},${cell.col}`;
}

export function parseCellKey(key: string): Cell {
  const [row, col] = key.split(",").map(Number);
  return { row, col };
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.row === b.row && a.col === b.col;
}

export function isInBounds(cell: Cell, size = GRID_SIZE): boolean {
  return cell.row >= 0 && cell.row < size && cell.col >= 0 && cell.col < size;
}

export function isBorderCell(cell: Cell, size = GRID_SIZE): boolean {
  return cell.row === 0 || cell.col === 0 || cell.row === size - 1 || cell.col === size - 1;
}

export function areOrthogonallyAdjacent(a: Cell, b: Cell): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

export function orthogonalNeighbors(cell: Cell, size = GRID_SIZE): Cell[] {
  const result: Cell[] = [];
  for (const step of ORTHOGONAL_STEPS) {
    const next = { row: cell.row + step.row, col: cell.col + step.col };
    if (isInBounds(next, size)) result.push(next);
  }
  return result;
}

export function rotateClockwise(rotation: Rotation): Rotation {
  return (((rotation + 90) % 360) as Rotation);
}

export function offsetForRotation(rotation: Rotation): Cell {
  return ROTATION_OFFSETS[rotation];
}

/** The second cell of a tile anchored at `anchor` with the given rotation. */
export function cellBForAnchor(anchor: Cell, rotation: Rotation): Cell {
  const offset = ROTATION_OFFSETS[rotation];
  return { row: anchor.row + offset.row, col: anchor.col + offset.col };
}

export function footprintForAnchor(
  anchor: Cell,
  rotation: Rotation,
  size = GRID_SIZE,
): { cellA: Cell; cellB: Cell } | null {
  const cellB = cellBForAnchor(anchor, rotation);
  if (!isInBounds(anchor, size) || !isInBounds(cellB, size)) return null;
  return { cellA: anchor, cellB };
}

/** Inverse of {@link cellBForAnchor} — the rotation that puts `cellB` next to `cellA`. */
export function rotationForCells(cellA: Cell, cellB: Cell): Rotation | null {
  const dRow = cellB.row - cellA.row;
  const dCol = cellB.col - cellA.col;
  for (const rotation of ROTATIONS) {
    const offset = ROTATION_OFFSETS[rotation];
    if (offset.row === dRow && offset.col === dCol) return rotation;
  }
  return null;
}

export function isHorizontal(rotation: Rotation): boolean {
  return rotation === 0 || rotation === 180;
}

export function clampCell(cell: Cell, size = GRID_SIZE): Cell {
  return {
    row: Math.min(size - 1, Math.max(0, cell.row)),
    col: Math.min(size - 1, Math.max(0, cell.col)),
  };
}
