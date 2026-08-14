import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { PlayScreen } from "@/components/play/PlayScreen";
import { useSessionStore } from "@/lib/session/sessionStore";
import { useGameStore } from "@/lib/state/gameStore";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn() }),
}));

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
  push.mockClear();
  useSessionStore.setState({
    session: null,
    results: null,
    isStarting: false,
    startError: null,
    hydrated: false,
  });
  useGameStore.setState({ puzzle: null, placed: [], status: "empty", solvedAt: null });
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  consoleWarnSpy.mockRestore();
});

describe("play screen", () => {
  it("starts a run on arrival and mounts the board, tray, and HUD", async () => {
    render(<PlayScreen modeId="streak-5" />);

    await waitFor(() => expect(screen.getByRole("heading", { name: "5 Puzzle Streak" })).toBeInTheDocument());

    expect(screen.getByRole("region", { name: "Tile tray" })).toBeInTheDocument();
    expect(screen.getByText("START")).toBeInTheDocument();
    expect(screen.getByText("END")).toBeInTheDocument();
    expect(screen.getByText("1 / 5")).toBeInTheDocument();
    expect(useSessionStore.getState().session?.modeId).toBe("streak-5");
  });

  it("mounts without logging any console errors or warnings", async () => {
    render(<PlayScreen modeId="streak-5" />);
    await waitFor(() => expect(screen.getByText("START")).toBeInTheDocument());

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it("renders every tray tile as a draggable, focusable control", async () => {
    render(<PlayScreen modeId="streak-5" />);
    await waitFor(() => expect(screen.getByText("START")).toBeInTheDocument());

    const puzzle = useGameStore.getState().puzzle!;
    const trayTiles = screen.getAllByRole("button", { name: /in tray/ });
    expect(trayTiles).toHaveLength(puzzle.dominoSet.length);
    expect(trayTiles[0]).not.toBeDisabled();
  });

  it("supports the keyboard-only path: select, rotate with R, place with Enter", async () => {
    render(<PlayScreen modeId="streak-5" />);
    await waitFor(() => expect(screen.getByText("START")).toBeInTheDocument());

    const trayTile = screen.getAllByRole("button", { name: /in tray/ })[0];
    fireEvent.click(trayTile);
    expect(useGameStore.getState().selectedTileId).toBeTruthy();

    fireEvent.keyDown(window, { key: "r" });
    expect(useGameStore.getState().selectionRotation).toBe(90);
    fireEvent.keyDown(window, { key: "r" });
    expect(useGameStore.getState().selectionRotation).toBe(180);

    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(useGameStore.getState().cursor).toEqual({ row: 2, col: 3 });

    fireEvent.keyDown(window, { key: "Enter" });
    await waitFor(() => expect(useGameStore.getState().placed).toHaveLength(1));

    const placement = useGameStore.getState().placed[0];
    expect(placement.cellA).toEqual({ row: 2, col: 3 });
    expect(placement.rotation).toBe(180);

    // Backspace over a placed tile lifts it back to the tray.
    fireEvent.keyDown(window, { key: "Backspace" });
    expect(useGameStore.getState().placed).toHaveLength(0);
  });

  it("plays the win chain and advances to the next puzzle on a solve", async () => {
    render(<PlayScreen modeId="streak-5" />);
    await waitFor(() => expect(screen.getByText("START")).toBeInTheDocument());

    const puzzle = useGameStore.getState().puzzle!;
    act(() => {
      for (const placement of puzzle.solution) {
        useGameStore.getState().placeTile(placement.tileId, placement.cellA, placement.rotation);
      }
      useGameStore.getState().checkSolution();
    });

    expect(useGameStore.getState().status).toBe("solved");

    // The celebration runs first, then the session advances (§9.3).
    await waitFor(
      () => expect(useSessionStore.getState().session?.currentPuzzleIndex).toBe(1),
      { timeout: 5_000 },
    );
    await waitFor(() => expect(screen.getByText("2 / 5")).toBeInTheDocument());
    expect(useSessionStore.getState().session?.puzzleTimesMs).toHaveLength(1);
  });

  it("shows a retryable error instead of crashing when a run cannot start", async () => {
    useSessionStore.setState({ startError: "Puzzle generation failed.", hydrated: true });
    render(<PlayScreen modeId="streak-5" />);

    expect(await screen.findByText("Puzzle generation failed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("reports an unregistered mode rather than rendering a broken board", () => {
    render(<PlayScreen modeId="streak-42" />);
    expect(screen.getByText("Unknown mode")).toBeInTheDocument();
  });
});
