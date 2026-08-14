import { describe, expect, it } from "vitest";
import { getMode, listModes, requireMode } from "@/lib/modes";
import { isPuzzleSolved, indexTiles } from "@/lib/domino/validator";

describe("mode registry", () => {
  it("registers the three shipping streak modes as menu-visible", () => {
    const visible = listModes().map((mode) => mode.id);
    expect(visible).toEqual(["streak-5", "streak-10", "streak-15"]);
  });

  it("keeps the practice stub registered but hidden", () => {
    expect(listModes({ includeHidden: true }).map((mode) => mode.id)).toContain("practice");
    expect(getMode("practice")?.hiddenFromMenu).toBe(true);
  });

  it("throws a clear error for an unknown mode id", () => {
    expect(() => requireMode("streak-99")).toThrow(/Unknown game mode/);
    expect(getMode("streak-99")).toBeUndefined();
  });
});

describe("streak mode definitions", () => {
  it("creates a session with one solvable puzzle per streak position", () => {
    const mode = requireMode("streak-5");
    const session = mode.createSession({ seed: 1234, now: 1_000 });

    expect(session.modeId).toBe("streak-5");
    expect(session.puzzles).toHaveLength(5);
    expect(session.currentPuzzleIndex).toBe(0);
    expect(session.meta).toMatchObject({ streakLength: 5, seed: 1234 });

    for (const puzzle of session.puzzles) {
      expect(isPuzzleSolved(puzzle, puzzle.solution, indexTiles(puzzle.dominoSet))).toBe(true);
    }
  });

  it("ramps difficulty across the streak", () => {
    const session = requireMode("streak-15").createSession({ seed: 99, now: 0 });
    expect(session.puzzles[0].setId).toBe("double-six");
    expect(session.puzzles[14].setId).toBe("double-nine");
  });

  it("advances until the final puzzle, then finishes", () => {
    const mode = requireMode("streak-5");
    const session = mode.createSession({ seed: 7, now: 0 });

    expect(mode.onPuzzleComplete(session, 1_000)).toEqual({ type: "advance" });
    expect(mode.onPuzzleComplete({ ...session, currentPuzzleIndex: 4 }, 1_000)).toEqual({
      type: "finish",
    });
  });

  it("summarises a finished streak into ranked results", () => {
    const mode = requireMode("streak-5");
    const session = mode.createSession({ seed: 7, now: 0 });
    const results = mode.onSessionComplete({
      ...session,
      puzzleTimesMs: [10_000, 20_000, 30_000, 15_000, 25_000],
    });

    expect(results).not.toBeNull();
    expect(results!.totalTimeMs).toBe(100_000);
    expect(results!.fastestPuzzleMs).toBe(10_000);
    expect(results!.slowestPuzzleMs).toBe(30_000);
    expect(results!.rankId).toBe("the-flash");
  });

  it("returns no results for a streak with nothing solved", () => {
    const mode = requireMode("streak-10");
    const session = mode.createSession({ seed: 3, now: 0 });
    expect(mode.onSessionComplete(session)).toBeNull();
  });
});

describe("practice stub", () => {
  it("is a single unscored puzzle that finishes immediately", () => {
    const mode = requireMode("practice");
    const session = mode.createSession({ seed: 5, now: 0 });

    expect(session.puzzles).toHaveLength(1);
    expect(mode.scoringPolicy).toBe("none");
    expect(mode.onPuzzleComplete(session, 1_000)).toEqual({ type: "finish" });
    expect(mode.onSessionComplete(session)).toBeNull();
  });
});
