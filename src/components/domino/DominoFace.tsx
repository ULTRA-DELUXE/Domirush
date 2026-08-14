import { cn } from "@/lib/utils/cn";
import type { DominoTile, PipValue } from "@/lib/domino/types";

/**
 * Pip positions on a 3×3 field. Marks are squares rather than dots (§5.2) — which also means
 * a rotated tile's pips stay legible, since a square reads identically at every 90° step.
 */
const PIP_PATTERNS: Record<number, number[]> = {
  0: [],
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
  7: [0, 2, 3, 4, 5, 6, 8],
  8: [0, 1, 2, 3, 5, 6, 7, 8],
  9: [0, 1, 2, 3, 4, 5, 6, 7, 8],
};

function PipHalf({ value }: { value: PipValue }) {
  const marks = PIP_PATTERNS[value] ?? [];
  return (
    <div className="grid h-full w-1/2 shrink-0 grid-cols-3 grid-rows-3 gap-[6%] p-[10%]">
      {Array.from({ length: 9 }, (_, index) => (
        <span
          key={index}
          className={marks.includes(index) ? "pip bg-broken-black" : ""}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export interface DominoFaceProps {
  tile: DominoTile;
  className?: string;
}

/** Broken-white fill, broken-black outline — the only tile recipe (§5.1). */
export function DominoFace({ tile, className }: DominoFaceProps) {
  return (
    <div
      className={cn(
        "domino-face flex h-full w-full items-stretch border-2 border-broken-black bg-broken-white",
        className,
      )}
    >
      <PipHalf value={tile.a} />
      <span className="w-[2px] shrink-0 bg-broken-black" aria-hidden="true" />
      <PipHalf value={tile.b} />
    </div>
  );
}

export function dominoLabel(tile: DominoTile): string {
  return `Domino ${tile.a} ${tile.b}`;
}
