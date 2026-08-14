import { GRID_SIZE, isInBounds } from "@/lib/domino/geometry";
import type { Cell } from "@/lib/domino/types";

export interface BoardMetrics {
  rect: DOMRect;
  cellSize: number;
}

export function getBoardMetrics(boardEl: HTMLElement | null): BoardMetrics | null {
  if (!boardEl) return null;
  const rect = boardEl.getBoundingClientRect();
  if (rect.width === 0) return null;
  return { rect, cellSize: rect.width / GRID_SIZE };
}

/** Viewport point → grid cell, or null when the point is off the board. */
export function cellFromPoint(boardEl: HTMLElement | null, x: number, y: number): Cell | null {
  const metrics = getBoardMetrics(boardEl);
  if (!metrics) return null;

  const cell = {
    row: Math.floor((y - metrics.rect.top) / metrics.cellSize),
    col: Math.floor((x - metrics.rect.left) / metrics.cellSize),
  };
  return isInBounds(cell) ? cell : null;
}

/** Percentage offsets, so board children scale with the board instead of a fixed pixel size. */
export function cellPercent(cell: Cell): { left: string; top: string } {
  return {
    left: `${(cell.col / GRID_SIZE) * 100}%`,
    top: `${(cell.row / GRID_SIZE) * 100}%`,
  };
}

export const CELL_PERCENT = 100 / GRID_SIZE;

export function pointerPosition(event: Event | null): { x: number; y: number } | null {
  if (!event) return null;
  const touchEvent = event as TouchEvent;
  if (touchEvent.changedTouches?.length) {
    const touch = touchEvent.changedTouches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
  const mouseEvent = event as MouseEvent;
  if (typeof mouseEvent.clientX === "number") {
    return { x: mouseEvent.clientX, y: mouseEvent.clientY };
  }
  return null;
}
