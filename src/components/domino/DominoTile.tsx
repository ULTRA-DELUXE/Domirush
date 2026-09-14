"use client";

import { useRef } from "react";
import {
  Draggable,
  animateTileDrop,
  animateTilePickup,
  animateTileReturn,
  animateTileRotation,
  gsap,
  useGSAP,
} from "@/lib/animations";
import { CELL_PERCENT, cellPercent, pointerPosition } from "@/lib/utils/board";
import { cn } from "@/lib/utils/cn";
import type { DominoTile as DominoTileModel, PlacedTile, Rotation } from "@/lib/domino/types";
import { DominoFace, dominoLabel } from "./DominoFace";

export interface DominoTileProps {
  tile: DominoTileModel;
  rotation: Rotation;
  /** Present when the tile sits on the board; absent when it's in the tray. */
  placement?: PlacedTile;
  isSelected: boolean;
  isInChain?: boolean;
  isHinted?: boolean;
  disabled?: boolean;
  onPickup: (tileId: string) => void;
  onDragMove: (point: { x: number; y: number } | null) => void;
  onDrop: (tileId: string, point: { x: number; y: number } | null) => boolean;
  onActivate: (tileId: string) => void;
}

export function DominoTile({
  tile,
  rotation,
  placement,
  isSelected,
  isInChain,
  isHinted,
  disabled,
  onPickup,
  onDragMove,
  onDrop,
  onActivate,
}: DominoTileProps) {
  const elementRef = useRef<HTMLButtonElement>(null);
  const didDragRef = useRef(false);
  const onBoard = Boolean(placement);

  useGSAP(
    () => {
      const element = elementRef.current;
      if (!element || disabled) return;

      const draggable = Draggable.create(element, {
        type: "x,y",
        dragClickables: true,
        minimumMovement: 4,
        onPress() {
          didDragRef.current = false;
        },
        onDragStart() {
          didDragRef.current = true;
          onPickup(tile.id);
          animateTilePickup(element);
        },
        onDrag() {
          onDragMove(pointerPosition(this.pointerEvent));
        },
        onDragEnd() {
          const point = pointerPosition(this.pointerEvent);
          onDragMove(null);
          const placed = onDrop(tile.id, point);
          // A committed placement re-renders the tile at its new cell, so only an unplaced
          // tile needs its drag offset unwound.
          if (placed) animateTileDrop(element);
          else animateTileReturn(element);
        },
      })[0];

      return () => draggable?.kill();
    },
    { dependencies: [tile.id, disabled], scope: elementRef },
  );

  // Keep the element's transform in sync with store state: reset the drag offset whenever the
  // tile lands somewhere new, and tween rotation so R presses read as a turn, not a jump.
  useGSAP(
    () => {
      const element = elementRef.current;
      if (!element) return;
      gsap.set(element, { x: 0, y: 0 });
      animateTileRotation(element, rotation);
    },
    { dependencies: [rotation, placement?.cellA.row, placement?.cellA.col] },
  );

  const positionStyle = placement
    ? {
        position: "absolute" as const,
        ...cellPercent(placement.cellA),
        width: `${CELL_PERCENT * 2}%`,
        height: `${CELL_PERCENT}%`,
        // Pivot on half A's centre so a 90° turn lands half B in the adjacent cell exactly.
        transformOrigin: "25% 50%",
      }
    : { transformOrigin: "50% 50%" };

  return (
    <button
      ref={elementRef}
      type="button"
      data-tile-id={tile.id}
      disabled={disabled}
      aria-label={`${dominoLabel(tile)}${onBoard ? " (placed)" : " (in tray)"}`}
      aria-pressed={isSelected}
      onClick={() => {
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        onActivate(tile.id);
      }}
      className={cn(
        "block touch-none",
        !onBoard && "tray-tile",
        isSelected && "ring-4 ring-navy",
        isHinted && "ring-4 ring-gold",
        disabled ? "cursor-default" : "cursor-grab active:cursor-grabbing",
      )}
      style={positionStyle}
    >
      {/* Chain membership reads as a gold glow, not another outline — navy stays the ink. */}
      <DominoFace tile={tile} className={cn(isInChain && "shadow-[0_0_0_3px_#e2b540]")} />
    </button>
  );
}
