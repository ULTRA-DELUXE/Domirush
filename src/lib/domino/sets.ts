import type { DominoSetId, DominoTile } from "./types";

const MAX_PIP: Record<DominoSetId, number> = {
  "double-six": 6,
  "double-eight": 8,
  "double-nine": 9,
};

export function maxPipForSet(setId: DominoSetId): number {
  return MAX_PIP[setId];
}

/** Every unordered pip pair in the set exactly once (28 / 45 / 55 tiles). */
export function createDominoSet(setId: DominoSetId): DominoTile[] {
  const max = MAX_PIP[setId];
  const tiles: DominoTile[] = [];
  for (let a = 0; a <= max; a += 1) {
    for (let b = a; b <= max; b += 1) {
      tiles.push({ id: `${a}-${b}`, a, b });
    }
  }
  return tiles;
}

export function tileIdFor(a: number, b: number): string {
  return a <= b ? `${a}-${b}` : `${b}-${a}`;
}

export function tileMatchesPips(tile: DominoTile, a: number, b: number): boolean {
  return (tile.a === a && tile.b === b) || (tile.a === b && tile.b === a);
}

/** The pip on the tile's other half, or null when `value` isn't on the tile. */
export function otherPip(tile: DominoTile, value: number): number | null {
  if (tile.a === value) return tile.b;
  if (tile.b === value) return tile.a;
  return null;
}
