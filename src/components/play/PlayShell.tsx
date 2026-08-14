"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  animateChainTrace,
  animateTileReject,
  gsap,
  playWinChain,
  useGSAP,
  playScreenEnter,
} from "@/lib/animations";
import { GRID_SIZE } from "@/lib/domino/geometry";
import type { Cell } from "@/lib/domino/types";
import { buildOccupancy, checkPlacement, indexTiles } from "@/lib/domino/validator";
import type { GameModeDefinition } from "@/lib/modes/types";
import { readSettings } from "@/lib/persistence/localStore";
import { getCompletedTimeMs } from "@/lib/session/sessionFlow";
import { useSessionStore } from "@/lib/session/sessionStore";
import { selectBoardDerived, useGameStore } from "@/lib/state/gameStore";
import { CELL_PERCENT, cellFromPoint, getBoardMetrics } from "@/lib/utils/board";
import { ConnectionGlow } from "@/components/grid/ConnectionGlow";
import { Grid } from "@/components/grid/Grid";
import { DominoTile } from "@/components/domino/DominoTile";
import { DominoTray } from "@/components/domino/DominoTray";
import { ModeHud } from "@/components/hud/ModeHud";
import type { GameSessionFlow } from "@/hooks/useGameSessionFlow";

export interface PlayShellProps {
  mode: GameModeDefinition;
  flow: GameSessionFlow;
}

export function PlayShell({ mode, flow }: PlayShellProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const draggingTileIdRef = useRef<string | null>(null);

  const puzzle = useGameStore((state) => state.puzzle);
  const placed = useGameStore((state) => state.placed);
  const status = useGameStore((state) => state.status);
  const cursor = useGameStore((state) => state.cursor);
  const hint = useGameStore((state) => state.hint);
  const selectedTileId = useGameStore((state) => state.selectedTileId);
  const selectionRotation = useGameStore((state) => state.selectionRotation);

  const derived = useMemo(() => selectBoardDerived({ puzzle, placed }), [puzzle, placed]);

  const tilesById = useMemo(
    () => (puzzle ? indexTiles(puzzle.dominoSet) : new Map()),
    [puzzle],
  );

  const chainTileIds = useMemo(() => new Set(derived.chain.tileIds), [derived.chain]);

  const chainElements = useCallback(() => {
    const board = boardRef.current;
    if (!board) return [];
    return useGameStore
      .getState()
      .placed.map((placement) => placement.tileId)
      .filter((tileId) => chainTileIds.has(tileId))
      .map((tileId) => board.querySelector<HTMLElement>(`[data-tile-id="${tileId}"]`))
      .filter((element): element is HTMLElement => Boolean(element));
  }, [chainTileIds]);

  /** "Check Path" traces the partial chain from Start so progress is visible, not just win/lose. */
  const handleCheckPath = useCallback(() => {
    if (useGameStore.getState().checkSolution()) return;
    const elements = chainElements();
    if (elements.length > 0) animateChainTrace(elements);
  }, [chainElements]);

  /** Ghost preview is written straight to the DOM — a drag must not re-render the board. */
  const updateGhost = useCallback(
    (point: { x: number; y: number } | null) => {
      const ghost = ghostRef.current;
      if (!ghost) return;

      const metrics = getBoardMetrics(boardRef.current);
      const cell = point ? cellFromPoint(boardRef.current, point.x, point.y) : null;
      const currentPuzzle = useGameStore.getState().puzzle;

      if (!point || !cell || !metrics || !currentPuzzle) {
        gsap.set(ghost, { autoAlpha: 0 });
        return;
      }

      const state = useGameStore.getState();
      const occupancy = buildOccupancy(state.placed, indexTiles(currentPuzzle.dominoSet));
      const check = checkPlacement(
        currentPuzzle,
        occupancy,
        cell,
        state.selectionRotation,
        draggingTileIdRef.current ?? undefined,
      );

      gsap.set(ghost, {
        autoAlpha: 1,
        x: cell.col * metrics.cellSize,
        y: cell.row * metrics.cellSize,
        rotation: state.selectionRotation,
        borderColor: check.ok ? "#121214" : "#ff4d4d",
        backgroundColor: check.ok ? "rgba(127,209,255,0.45)" : "rgba(255,77,77,0.35)",
      });
    },
    [],
  );

  const handlePickup = useCallback((tileId: string) => {
    draggingTileIdRef.current = tileId;
    useGameStore.getState().selectTile(tileId);
  }, []);

  const runAutoCheck = useCallback(() => {
    if (readSettings().autoCheck) useGameStore.getState().checkSolution();
  }, []);

  const handleDrop = useCallback(
    (tileId: string, point: { x: number; y: number } | null) => {
      draggingTileIdRef.current = null;
      updateGhost(null);

      const state = useGameStore.getState();
      const cell = point ? cellFromPoint(boardRef.current, point.x, point.y) : null;

      if (!cell) {
        // Released off-grid: a placed tile goes back to the tray, a tray tile just stays put.
        if (state.placed.some((placement) => placement.tileId === tileId)) {
          state.removeTile(tileId);
        }
        return false;
      }

      const placedOk = state.placeTile(tileId, cell, state.selectionRotation);
      if (placedOk) runAutoCheck();
      return placedOk;
    },
    [runAutoCheck, updateGhost],
  );

  const handleActivate = useCallback((tileId: string) => {
    const state = useGameStore.getState();
    state.selectTile(state.selectedTileId === tileId ? null : tileId);
  }, []);

  const handleCellSelect = useCallback(
    (cell: Cell) => {
      const state = useGameStore.getState();
      state.setCursor(cell);
      if (!state.selectedTileId) return;
      if (state.placeSelectionAt(cell)) runAutoCheck();
      else if (ghostRef.current) animateTileReject(ghostRef.current);
    },
    [runAutoCheck],
  );

  // Keyboard path (§10): rotate with R, drive the cursor with arrows, place with Enter.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (state.status !== "playing") return;

      switch (event.key) {
        case "r":
        case "R":
          event.preventDefault();
          state.rotateSelection();
          break;
        case "ArrowUp":
          event.preventDefault();
          state.moveCursor(-1, 0);
          break;
        case "ArrowDown":
          event.preventDefault();
          state.moveCursor(1, 0);
          break;
        case "ArrowLeft":
          event.preventDefault();
          state.moveCursor(0, -1);
          break;
        case "ArrowRight":
          event.preventDefault();
          state.moveCursor(0, 1);
          break;
        case "Enter":
        case " ":
          if (!state.selectedTileId) return;
          event.preventDefault();
          if (state.placeSelectionAt(state.cursor)) runAutoCheck();
          break;
        case "Escape":
          state.selectTile(null);
          break;
        case "Backspace":
        case "Delete": {
          const occupant = state.placed.find(
            (placement) =>
              (placement.cellA.row === state.cursor.row &&
                placement.cellA.col === state.cursor.col) ||
              (placement.cellB.row === state.cursor.row &&
                placement.cellB.col === state.cursor.col),
          );
          if (occupant) {
            event.preventDefault();
            state.removeTile(occupant.tileId);
          }
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [runAutoCheck]);

  // Win celebration retraces the solved chain Start → Target, then hands back to the session.
  useGSAP(
    () => {
      if (status !== "solved") return;
      const board = boardRef.current;
      if (!board) return;

      const chainElements = derived.chain.tileIds
        .map((tileId) => board.querySelector<HTMLElement>(`[data-tile-id="${tileId}"] .domino-face`))
        .filter((element): element is HTMLElement => Boolean(element));

      playWinChain(chainElements, () => flow.completeCurrentPuzzle());
    },
    { dependencies: [status] },
  );

  useGSAP(
    () => {
      if (shellRef.current) playScreenEnter(shellRef.current.children);
    },
    { dependencies: [mode.id], scope: shellRef },
  );

  const getPuzzleMs = useCallback(() => {
    const session = useSessionStore.getState().session;
    if (!session) return 0;
    const solvedAt = useGameStore.getState().solvedAt;
    return (solvedAt ?? Date.now()) - session.currentPuzzleStartedAt;
  }, []);

  const getTotalMs = useCallback(() => {
    const session = useSessionStore.getState().session;
    if (!session) return 0;
    return getCompletedTimeMs(session) + getPuzzleMs();
  }, [getPuzzleMs]);

  if (!puzzle) return null;

  const hintTile = hint ? tilesById.get(hint.tileId) : null;

  return (
    <div ref={shellRef} className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 lg:p-8">
      <ModeHud
        mode={mode}
        position={flow.position}
        total={flow.total}
        getPuzzleMs={getPuzzleMs}
        getTotalMs={getTotalMs}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="mx-auto w-full max-w-[36rem]">
          <Grid ref={boardRef} puzzle={puzzle} cursor={cursor} onCellSelect={handleCellSelect}>
            {placed.map((placement) => {
              const tile = tilesById.get(placement.tileId);
              if (!tile) return null;
              return (
                <DominoTile
                  key={placement.tileId}
                  tile={tile}
                  rotation={placement.rotation}
                  placement={placement}
                  isSelected={selectedTileId === placement.tileId}
                  isInChain={chainTileIds.has(placement.tileId)}
                  onPickup={handlePickup}
                  onDragMove={updateGhost}
                  onDrop={handleDrop}
                  onActivate={handleActivate}
                />
              );
            })}

            <ConnectionGlow junctions={derived.junctions} />

            <div
              ref={ghostRef}
              className="ghost-tile pointer-events-none absolute left-0 top-0 border-2 opacity-0"
              style={{
                width: `${CELL_PERCENT * 2}%`,
                height: `${CELL_PERCENT}%`,
                transformOrigin: "25% 50%",
              }}
              aria-hidden="true"
            />

            {hint && (
              <div
                className="pointer-events-none absolute border-2 border-dashed border-electric-pulse"
                style={{
                  left: `${(hint.cellA.col / GRID_SIZE) * 100}%`,
                  top: `${(hint.cellA.row / GRID_SIZE) * 100}%`,
                  width: `${CELL_PERCENT * 2}%`,
                  height: `${CELL_PERCENT}%`,
                  transformOrigin: "25% 50%",
                  transform: `rotate(${hint.rotation}deg)`,
                }}
                aria-hidden="true"
              />
            )}
          </Grid>
        </div>

        <PlayControls
          mode={mode}
          onCheckPath={handleCheckPath}
          chainLength={derived.chain.tileIds.length}
          hintTileLabel={hintTile ? `${hintTile.a}·${hintTile.b}` : null}
        />
      </div>

      <DominoTray
        tiles={derived.trayTiles}
        rotation={selectionRotation}
        selectedTileId={selectedTileId}
        hintTileId={hint?.tileId ?? null}
        onPickup={handlePickup}
        onDragMove={updateGhost}
        onDrop={handleDrop}
        onActivate={handleActivate}
      />
    </div>
  );
}

function PlayControls({
  mode,
  onCheckPath,
  chainLength,
  hintTileLabel,
}: {
  mode: GameModeDefinition;
  onCheckPath: () => void;
  chainLength: number;
  hintTileLabel: string | null;
}) {
  const rotateSelection = useGameStore((state) => state.rotateSelection);
  const revealHint = useGameStore((state) => state.revealHint);
  const placedCount = useGameStore((state) => state.placed.length);

  return (
    <aside className="flex flex-col gap-3 border-2 border-broken-black bg-broken-white/10 p-4">
      <h2 className="label opacity-70">Controls</h2>

      {/* On-screen rotate is the tablet equivalent of the physical R key (§10). */}
      <button type="button" className="btn btn-ghost" onClick={rotateSelection}>
        Rotate 90° (R)
      </button>

      <button type="button" className="btn btn-ghost" onClick={onCheckPath}>
        Check path
      </button>

      {mode.hud.showHint && (
        <button type="button" className="btn btn-ghost" onClick={() => revealHint()}>
          {hintTileLabel ? `Hint: ${hintTileLabel}` : "Hint"}
        </button>
      )}

      <p className="mt-2 text-sm leading-relaxed opacity-80">
        Drag a tile onto the grid, or select it and place with Enter. Touching halves must show
        the same number. Bridge Start to End to solve.
      </p>

      <p className="text-sm opacity-70">
        Tiles placed: {placedCount} · chained from Start: {chainLength}
      </p>
    </aside>
  );
}
