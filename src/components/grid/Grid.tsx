"use client";

import { forwardRef, type ReactNode } from "react";
import { GRID_SIZE, sameCell } from "@/lib/domino/geometry";
import type { Cell, PuzzleDefinition } from "@/lib/domino/types";
import { CELL_PERCENT, cellPercent } from "@/lib/utils/board";
import { EndpointMarker, GridCell } from "./GridCell";

export interface GridProps {
  puzzle: PuzzleDefinition;
  cursor: Cell;
  onCellSelect: (cell: Cell) => void;
  children?: ReactNode;
}

const CELLS: Cell[] = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
  row: Math.floor(index / GRID_SIZE),
  col: index % GRID_SIZE,
}));

/**
 * The 8×8 board: navy field, cream rules, cream markers and tiles.
 * Children (placed tiles, drag ghost, junction glows) are positioned in percentages so the whole
 * board scales with its container.
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { puzzle, cursor, onCellSelect, children },
  ref,
) {
  return (
    <div
      ref={ref}
      className="relative z-10 h-full w-full border border-cream bg-navy"
    >
      <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
        {CELLS.map((cell) => (
          <GridCell
            key={`${cell.row}-${cell.col}`}
            cell={cell}
            isCursor={sameCell(cell, cursor)}
            onSelect={onCellSelect}
          />
        ))}
      </div>

      {([["start", puzzle.start], ["target", puzzle.target]] as const).map(([kind, marker]) => (
        <div
          key={kind}
          className="pointer-events-none absolute"
          style={{
            ...cellPercent(marker),
            width: `${CELL_PERCENT}%`,
            height: `${CELL_PERCENT}%`,
          }}
        >
          <EndpointMarker kind={kind} value={marker.value} />
        </div>
      ))}

      {children}
    </div>
  );
});
