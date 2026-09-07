"use client";

import { cn } from "@/lib/utils/cn";
import type { Cell, PipValue } from "@/lib/domino/types";

export interface GridCellProps {
  cell: Cell;
  isCursor: boolean;
  onSelect: (cell: Cell) => void;
}

export function GridCell({ cell, isCursor, onSelect }: GridCellProps) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={`Row ${cell.row + 1}, column ${cell.col + 1}`}
      onClick={() => onSelect(cell)}
      className={cn(
        "border-r border-b border-cream/35 transition-colors",
        cell.col === 7 && "border-r-0",
        cell.row === 7 && "border-b-0",
        isCursor && "bg-cream/25",
      )}
    />
  );
}

export interface EndpointMarkerProps {
  kind: "start" | "target";
  value: PipValue;
}

/** Start/Target are markers, not placeable cells — the chain's open ends must match them. */
export function EndpointMarker({ kind, value }: EndpointMarkerProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center border-2 border-navy bg-cream text-navy">
      <span className="label leading-none opacity-70">{kind === "start" ? "START" : "END"}</span>
      <span className="font-display text-[min(4.5vw,1.75rem)] leading-none">{value}</span>
    </div>
  );
}
