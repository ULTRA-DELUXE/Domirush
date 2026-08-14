import { beforeEach, describe, expect, it } from "vitest";
import "@/lib/modes";
import { orthogonalNeighbors, rotationForCells } from "@/lib/domino/geometry";
import { getCurrentPuzzle } from "@/lib/session/sessionFlow";
import { useSessionStore } from "@/lib/session/sessionStore";
import { useGameStore } from "@/lib/state/gameStore";

function resetAll() {
  window.sessionStorage.clear();
  window.localStorage.clear();
  useSessionStore.setState({
    session: null,
    results: null,
    isStarting: false,
    startError: null,
    hydrated: false,
  });
  useGameStore.setState({ puzzle: null, placed: [], status: "empty", solvedAt: null });
}

/** Plays a whole streak the way the UI does: load puzzle → place tiles → check → advance. */
describe("full streak playthrough", () => {
  beforeEach(resetAll);

  it("solves every puzzle in a 5-streak and lands on ranked results", () => {
    expect(useSessionStore.getState().startSession("streak-5")).toBe(true);

    for (let index = 0; index < 5; index += 1) {
      const session = useSessionStore.getState().session!;
      expect(session.currentPuzzleIndex).toBe(index);

      const puzzle = getCurrentPuzzle(session)!;
      useGameStore.getState().loadPuzzle(puzzle);

      // An empty board is never a win; the generated solution always is. (A *partial* chain can
      // legitimately win when an alternate shorter solution exists — §4.1 allows multiple.)
      expect(useGameStore.getState().checkSolution()).toBe(false);

      for (const placement of puzzle.solution) {
        expect(
          useGameStore
            .getState()
            .placeTile(placement.tileId, placement.cellA, placement.rotation),
        ).toBe(true);
      }
      expect(useGameStore.getState().checkSolution()).toBe(true);
      expect(useGameStore.getState().solvedAt).toBeTypeOf("number");

      const outcome = useSessionStore.getState().completePuzzle(30_000);
      expect(outcome.type).toBe(index === 4 ? "finish" : "advance");
    }

    const results = useSessionStore.getState().finishSession();
    expect(results?.puzzleTimesMs).toHaveLength(5);
    expect(results?.totalTimeMs).toBe(150_000);
    expect(results?.rankId).toBe("late-for-work");
  });

  it.each([
    ["streak-5", 5, 20_000, "the-flash"],
    ["streak-10", 10, 40_000, "late-for-work"],
    ["streak-15", 15, 70_000, "soccer-mom"],
  ] as const)("plays %s to completion and ranks the run", (modeId, count, perPuzzleMs, expectedRank) => {
    expect(useSessionStore.getState().startSession(modeId)).toBe(true);

    for (let index = 0; index < count; index += 1) {
      const puzzle = getCurrentPuzzle(useSessionStore.getState().session!)!;
      useGameStore.getState().loadPuzzle(puzzle);
      for (const placement of puzzle.solution) {
        useGameStore.getState().placeTile(placement.tileId, placement.cellA, placement.rotation);
      }
      expect(useGameStore.getState().checkSolution()).toBe(true);
      useSessionStore.getState().completePuzzle(perPuzzleMs);
    }

    const results = useSessionStore.getState().finishSession();
    expect(results?.puzzleTimesMs).toHaveLength(count);
    expect(results?.rankId).toBe(expectedRank);
  });

  it("lets a player undo a placement without soft-locking the puzzle", () => {
    useSessionStore.getState().startSession("streak-5");
    const puzzle = getCurrentPuzzle(useSessionStore.getState().session!)!;
    useGameStore.getState().loadPuzzle(puzzle);

    for (const placement of puzzle.solution) {
      useGameStore.getState().placeTile(placement.tileId, placement.cellA, placement.rotation);
    }
    expect(useGameStore.getState().checkSolution()).toBe(true);

    useGameStore.getState().removeTile(puzzle.solution[0].tileId);
    expect(useGameStore.getState().status).toBe("playing");
    expect(useGameStore.getState().checkSolution()).toBe(false);

    const first = puzzle.solution[0];
    useGameStore.getState().placeTile(first.tileId, first.cellA, first.rotation);
    expect(useGameStore.getState().checkSolution()).toBe(true);
  });

  it("refuses to stack a tile on an occupied cell or a marker", () => {
    useSessionStore.getState().startSession("streak-5");
    const puzzle = getCurrentPuzzle(useSessionStore.getState().session!)!;
    useGameStore.getState().loadPuzzle(puzzle);

    const [first, second] = puzzle.solution;
    useGameStore.getState().placeTile(first.tileId, first.cellA, first.rotation);

    expect(
      useGameStore.getState().placeTile(second.tileId, first.cellA, first.rotation),
    ).toBe(false);
    expect(useGameStore.getState().lastRejection).toBe("occupied");

    // Anchor on Start with a rotation that stays in bounds, so the endpoint rule is what rejects it.
    const inwardNeighbour = orthogonalNeighbors(puzzle.start)[0];
    const inwardRotation = rotationForCells(puzzle.start, inwardNeighbour)!;
    expect(
      useGameStore.getState().placeTile(second.tileId, puzzle.start, inwardRotation),
    ).toBe(false);
    expect(useGameStore.getState().lastRejection).toBe("endpoint-cell");
  });

  it("keeps the tray in sync as tiles move on and off the board", () => {
    useSessionStore.getState().startSession("streak-5");
    const puzzle = getCurrentPuzzle(useSessionStore.getState().session!)!;
    useGameStore.getState().loadPuzzle(puzzle);

    const trayCount = () => puzzle.dominoSet.length - useGameStore.getState().placed.length;
    expect(trayCount()).toBe(puzzle.dominoSet.length);

    const first = puzzle.solution[0];
    useGameStore.getState().placeTile(first.tileId, first.cellA, first.rotation);
    expect(trayCount()).toBe(puzzle.dominoSet.length - 1);

    useGameStore.getState().removeTile(first.tileId);
    expect(trayCount()).toBe(puzzle.dominoSet.length);
  });
});
