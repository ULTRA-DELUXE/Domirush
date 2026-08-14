import { describe, expect, it } from "vitest";
import {
  buildOccupancy,
  checkPlacement,
  getJunctions,
  indexTiles,
  isPuzzleSolved,
  traceChain,
} from "@/lib/domino/validator";
import type { PlacedTile, PuzzleDefinition } from "@/lib/domino/types";

/** Start (0,0)=3 → [3|4] → [4|5] → Target (0,3)=5 */
const puzzle: PuzzleDefinition = {
  id: "fixture",
  gridSize: 8,
  setId: "double-six",
  start: { row: 0, col: 0, value: 3 },
  target: { row: 0, col: 3, value: 5 },
  dominoSet: [
    { id: "3-4", a: 3, b: 4 },
    { id: "4-5", a: 4, b: 5 },
    { id: "1-6", a: 1, b: 6 },
  ],
  solutionTileIds: ["3-4", "4-5"],
  solution: [
    { tileId: "3-4", cellA: { row: 1, col: 0 }, cellB: { row: 1, col: 1 }, rotation: 0 },
    { tileId: "4-5", cellA: { row: 1, col: 2 }, cellB: { row: 1, col: 3 }, rotation: 0 },
  ],
};

const tilesById = indexTiles(puzzle.dominoSet);

const solution: PlacedTile[] = puzzle.solution;

describe("placement legality", () => {
  it("accepts an empty in-bounds footprint", () => {
    const check = checkPlacement(puzzle, new Map(), { row: 4, col: 4 }, 0);
    expect(check.ok).toBe(true);
  });

  it("rejects a footprint that leaves the grid", () => {
    const check = checkPlacement(puzzle, new Map(), { row: 4, col: 7 }, 0);
    expect(check).toEqual({ ok: false, reason: "out-of-bounds" });
  });

  it("rejects overlapping an occupied cell", () => {
    const occupancy = buildOccupancy(solution, tilesById);
    const check = checkPlacement(puzzle, occupancy, { row: 1, col: 1 }, 0);
    expect(check).toEqual({ ok: false, reason: "occupied" });
  });

  it("lets a tile be re-placed over its own cells", () => {
    const occupancy = buildOccupancy(solution, tilesById);
    const check = checkPlacement(puzzle, occupancy, { row: 1, col: 0 }, 0, "3-4");
    expect(check.ok).toBe(true);
  });

  it("rejects covering the Start or Target marker", () => {
    const check = checkPlacement(puzzle, new Map(), { row: 0, col: 0 }, 0);
    expect(check).toEqual({ ok: false, reason: "endpoint-cell" });
  });
});

describe("junction feedback", () => {
  it("flags a touching mismatch without blocking it", () => {
    const placed: PlacedTile[] = [
      solution[0],
      { tileId: "1-6", cellA: { row: 1, col: 2 }, cellB: { row: 1, col: 3 }, rotation: 0 },
    ];
    const junctions = getJunctions(puzzle, buildOccupancy(placed, tilesById));
    const tileToTile = junctions.filter((junction) => junction.kind === "tile-tile");
    expect(tileToTile).toHaveLength(1);
    expect(tileToTile[0].match).toBe(false);
  });

  it("reports a matching junction between two chained tiles", () => {
    const junctions = getJunctions(puzzle, buildOccupancy(solution, tilesById));
    const tileToTile = junctions.filter((junction) => junction.kind === "tile-tile");
    expect(tileToTile).toHaveLength(1);
    expect(tileToTile[0].match).toBe(true);
  });

  it("compares tiles touching a marker against the marker value", () => {
    const junctions = getJunctions(puzzle, buildOccupancy(solution, tilesById));
    const markerJunctions = junctions.filter((junction) => junction.kind === "marker-tile");
    expect(markerJunctions).toHaveLength(2);
    expect(markerJunctions.every((junction) => junction.match)).toBe(true);
  });
});

describe("chain tracing and win detection", () => {
  it("traces the full chain from Start to Target", () => {
    const trace = traceChain(puzzle, solution, tilesById);
    expect(trace.complete).toBe(true);
    expect(trace.tileIds).toEqual(["3-4", "4-5"]);
    expect(trace.cells).toHaveLength(4);
    expect(isPuzzleSolved(puzzle, solution, tilesById)).toBe(true);
  });

  it("returns the longest partial chain when the path does not reach Target", () => {
    const trace = traceChain(puzzle, [solution[0]], tilesById);
    expect(trace.complete).toBe(false);
    expect(trace.tileIds).toEqual(["3-4"]);
  });

  it("does not treat a mismatched neighbour as part of the chain", () => {
    const placed: PlacedTile[] = [
      solution[0],
      { tileId: "1-6", cellA: { row: 1, col: 2 }, cellB: { row: 1, col: 3 }, rotation: 0 },
    ];
    expect(isPuzzleSolved(puzzle, placed, tilesById)).toBe(false);
  });

  it("does not win when nothing touches Start", () => {
    const placed: PlacedTile[] = [
      { tileId: "3-4", cellA: { row: 5, col: 0 }, cellB: { row: 5, col: 1 }, rotation: 0 },
    ];
    expect(isPuzzleSolved(puzzle, placed, tilesById)).toBe(false);
  });
});
