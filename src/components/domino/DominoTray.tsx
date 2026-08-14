"use client";

import type { DominoTile as DominoTileModel, Rotation } from "@/lib/domino/types";
import { DominoTile } from "./DominoTile";

export interface DominoTrayProps {
  tiles: DominoTileModel[];
  rotation: Rotation;
  selectedTileId: string | null;
  hintTileId?: string | null;
  onPickup: (tileId: string) => void;
  onDragMove: (point: { x: number; y: number } | null) => void;
  onDrop: (tileId: string, point: { x: number; y: number } | null) => boolean;
  onActivate: (tileId: string) => void;
}

export function DominoTray({
  tiles,
  rotation,
  selectedTileId,
  hintTileId,
  onPickup,
  onDragMove,
  onDrop,
  onActivate,
}: DominoTrayProps) {
  return (
    <section
      aria-label="Tile tray"
      // Sits above the board's stacking context so a tile dragged out of the tray reads as
      // lifted over the grid rather than sliding underneath it (§2.2).
      className="relative z-50 border-2 border-broken-black bg-broken-white/10 p-3"
    >
      <div className="mb-2 flex items-baseline justify-between text-broken-white">
        <h2 className="label">Tray</h2>
        <span className="label opacity-70">{tiles.length} tiles</span>
      </div>
      <div className="flex flex-wrap gap-3">
        {tiles.map((tile) => (
          <DominoTile
            key={tile.id}
            tile={tile}
            rotation={selectedTileId === tile.id ? rotation : 0}
            isSelected={selectedTileId === tile.id}
            isHinted={hintTileId === tile.id}
            onPickup={onPickup}
            onDragMove={onDragMove}
            onDrop={onDrop}
            onActivate={onActivate}
          />
        ))}
      </div>
    </section>
  );
}
