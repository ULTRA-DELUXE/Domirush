import { create } from "zustand";
import { GRID_SIZE, clampCell, rotateClockwise, sameCell } from "../domino/geometry";
import { findHintPlacement } from "../domino/solver";
import type { Cell, DominoTile, PlacedTile, PuzzleDefinition, Rotation } from "../domino/types";
import {
  buildOccupancy,
  checkPlacement,
  getJunctions,
  indexTiles,
  traceChain,
  type ChainTrace,
  type Junction,
  type PlacementRejection,
} from "../domino/validator";

export type BoardStatus = "empty" | "playing" | "solved";

export interface BoardDerived {
  junctions: Junction[];
  chain: ChainTrace;
  trayTiles: DominoTile[];
}

export interface GameState {
  puzzle: PuzzleDefinition | null;
  placed: PlacedTile[];
  status: BoardStatus;
  selectedTileId: string | null;
  selectionRotation: Rotation;
  cursor: Cell;
  hint: PlacedTile | null;
  /** Bumped on every placement so animation effects can key off "something landed". */
  lastPlacedTileId: string | null;
  lastRejection: PlacementRejection | null;
  /**
   * Stamped the moment the chain completes, so the puzzle's recorded time excludes the win
   * celebration that plays before the session advances.
   */
  solvedAt: number | null;

  loadPuzzle: (puzzle: PuzzleDefinition) => void;
  clearBoard: () => void;
  selectTile: (tileId: string | null) => void;
  rotateSelection: () => void;
  setCursor: (cell: Cell) => void;
  moveCursor: (rowDelta: number, colDelta: number) => void;
  placeTile: (tileId: string, anchor: Cell, rotation: Rotation) => boolean;
  placeSelectionAt: (anchor: Cell) => boolean;
  removeTile: (tileId: string) => void;
  checkSolution: () => boolean;
  revealHint: () => PlacedTile | null;
  dismissHint: () => void;
}

const INITIAL_CURSOR: Cell = { row: 3, col: 3 };

export const useGameStore = create<GameState>((set, get) => ({
  puzzle: null,
  placed: [],
  status: "empty",
  selectedTileId: null,
  selectionRotation: 0,
  cursor: INITIAL_CURSOR,
  hint: null,
  lastPlacedTileId: null,
  lastRejection: null,
  solvedAt: null,

  loadPuzzle: (puzzle) =>
    set({
      puzzle,
      placed: [],
      status: "playing",
      selectedTileId: null,
      selectionRotation: 0,
      cursor: INITIAL_CURSOR,
      hint: null,
      lastPlacedTileId: null,
      lastRejection: null,
      solvedAt: null,
    }),

  clearBoard: () =>
    set({
      placed: [],
      status: "playing",
      selectedTileId: null,
      hint: null,
      lastPlacedTileId: null,
      solvedAt: null,
    }),

  selectTile: (tileId) => set({ selectedTileId: tileId, lastRejection: null }),

  rotateSelection: () => set((state) => ({ selectionRotation: rotateClockwise(state.selectionRotation) })),

  setCursor: (cell) => set({ cursor: clampCell(cell) }),

  moveCursor: (rowDelta, colDelta) =>
    set((state) => ({
      cursor: clampCell({
        row: state.cursor.row + rowDelta,
        col: state.cursor.col + colDelta,
      }, GRID_SIZE),
    })),

  placeTile: (tileId, anchor, rotation) => {
    const { puzzle, placed } = get();
    if (!puzzle) return false;

    const tilesById = indexTiles(puzzle.dominoSet);
    if (!tilesById.has(tileId)) return false;

    const occupancy = buildOccupancy(placed, tilesById);
    const check = checkPlacement(puzzle, occupancy, anchor, rotation, tileId);
    if (!check.ok) {
      set({ lastRejection: check.reason });
      return false;
    }

    const withoutTile = placed.filter((placement) => placement.tileId !== tileId);
    set({
      placed: [...withoutTile, { tileId, cellA: check.cellA, cellB: check.cellB, rotation }],
      selectedTileId: null,
      lastPlacedTileId: tileId,
      lastRejection: null,
      hint: null,
    });
    return true;
  },

  placeSelectionAt: (anchor) => {
    const { selectedTileId, selectionRotation, placeTile } = get();
    if (!selectedTileId) return false;
    return placeTile(selectedTileId, anchor, selectionRotation);
  },

  removeTile: (tileId) =>
    set((state) => ({
      placed: state.placed.filter((placement) => placement.tileId !== tileId),
      status: state.status === "solved" ? "playing" : state.status,
      hint: null,
    })),

  checkSolution: () => {
    const { puzzle, placed } = get();
    if (!puzzle) return false;
    const solved = traceChain(puzzle, placed, indexTiles(puzzle.dominoSet)).complete;
    if (solved && get().status !== "solved") {
      set({ status: "solved", selectedTileId: null, solvedAt: Date.now() });
    }
    return solved;
  },

  revealHint: () => {
    const { puzzle, placed } = get();
    if (!puzzle) return null;
    const hint = findHintPlacement(puzzle, placed);
    set({ hint });
    return hint;
  },

  dismissHint: () => set({ hint: null }),
}));

/** Derived board state. Kept out of the store so placements stay cheap during a drag. */
export function selectBoardDerived(state: Pick<GameState, "puzzle" | "placed">): BoardDerived {
  const { puzzle, placed } = state;
  if (!puzzle) {
    return { junctions: [], chain: { tileIds: [], cells: [], complete: false }, trayTiles: [] };
  }

  const tilesById = indexTiles(puzzle.dominoSet);
  const placedIds = new Set(placed.map((placement) => placement.tileId));

  return {
    junctions: getJunctions(puzzle, buildOccupancy(placed, tilesById)),
    chain: traceChain(puzzle, placed, tilesById),
    trayTiles: puzzle.dominoSet.filter((tile) => !placedIds.has(tile.id)),
  };
}

export function selectPlacementFor(state: GameState, tileId: string): PlacedTile | undefined {
  return state.placed.find((placement) => placement.tileId === tileId);
}

export function isCellOccupied(state: GameState, cell: Cell): boolean {
  return state.placed.some(
    (placement) => sameCell(placement.cellA, cell) || sameCell(placement.cellB, cell),
  );
}
