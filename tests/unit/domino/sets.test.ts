import { describe, expect, it } from "vitest";
import { createDominoSet, maxPipForSet, otherPip, tileIdFor } from "@/lib/domino/sets";

describe("domino sets", () => {
  it("builds the canonical set sizes", () => {
    expect(createDominoSet("double-six")).toHaveLength(28);
    expect(createDominoSet("double-eight")).toHaveLength(45);
    expect(createDominoSet("double-nine")).toHaveLength(55);
  });

  it("contains no duplicate pip pairs", () => {
    const ids = createDominoSet("double-nine").map((tile) => tile.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("normalises tile ids regardless of pip order", () => {
    expect(tileIdFor(5, 2)).toBe(tileIdFor(2, 5));
    expect(maxPipForSet("double-eight")).toBe(8);
  });

  it("reads the opposite half of a tile", () => {
    const tile = { id: "2-5", a: 2, b: 5 };
    expect(otherPip(tile, 2)).toBe(5);
    expect(otherPip(tile, 5)).toBe(2);
    expect(otherPip(tile, 4)).toBeNull();
  });
});
