import { describe, expect, it } from "vitest";
import {
  areOrthogonallyAdjacent,
  cellBForAnchor,
  footprintForAnchor,
  isBorderCell,
  orthogonalNeighbors,
  rotateClockwise,
  rotationForCells,
} from "@/lib/domino/geometry";

describe("geometry", () => {
  it("rotates clockwise through the four orientations and wraps", () => {
    expect(rotateClockwise(0)).toBe(90);
    expect(rotateClockwise(90)).toBe(180);
    expect(rotateClockwise(180)).toBe(270);
    expect(rotateClockwise(270)).toBe(0);
  });

  it("maps each rotation to a cell-exact second half", () => {
    const anchor = { row: 3, col: 3 };
    expect(cellBForAnchor(anchor, 0)).toEqual({ row: 3, col: 4 });
    expect(cellBForAnchor(anchor, 90)).toEqual({ row: 4, col: 3 });
    expect(cellBForAnchor(anchor, 180)).toEqual({ row: 3, col: 2 });
    expect(cellBForAnchor(anchor, 270)).toEqual({ row: 2, col: 3 });
  });

  it("never produces a diagonal footprint", () => {
    const anchor = { row: 2, col: 2 };
    for (const rotation of [0, 90, 180, 270] as const) {
      const footprint = footprintForAnchor(anchor, rotation);
      expect(footprint).not.toBeNull();
      expect(areOrthogonallyAdjacent(footprint!.cellA, footprint!.cellB)).toBe(true);
    }
  });

  it("rejects footprints that leave the grid", () => {
    expect(footprintForAnchor({ row: 0, col: 7 }, 0)).toBeNull();
    expect(footprintForAnchor({ row: 0, col: 0 }, 270)).toBeNull();
  });

  it("round-trips rotation through cell pairs", () => {
    expect(rotationForCells({ row: 1, col: 1 }, { row: 1, col: 2 })).toBe(0);
    expect(rotationForCells({ row: 1, col: 1 }, { row: 2, col: 1 })).toBe(90);
    expect(rotationForCells({ row: 1, col: 1 }, { row: 3, col: 3 })).toBeNull();
  });

  it("identifies border cells and clips neighbours to the grid", () => {
    expect(isBorderCell({ row: 0, col: 4 })).toBe(true);
    expect(isBorderCell({ row: 3, col: 3 })).toBe(false);
    expect(orthogonalNeighbors({ row: 0, col: 0 })).toHaveLength(2);
    expect(orthogonalNeighbors({ row: 4, col: 4 })).toHaveLength(4);
  });
});
