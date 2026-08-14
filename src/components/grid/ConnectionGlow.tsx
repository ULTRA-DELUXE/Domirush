"use client";

import { useRef } from "react";
import { animateConnectionPulse, animateMismatchFlash, useGSAP } from "@/lib/animations";
import { GRID_SIZE } from "@/lib/domino/geometry";
import type { Junction } from "@/lib/domino/validator";
import { cn } from "@/lib/utils/cn";

function junctionKey(junction: Junction): string {
  return [
    `${junction.cellA.row},${junction.cellA.col}`,
    `${junction.cellB.row},${junction.cellB.col}`,
  ]
    .sort()
    .join("|");
}

function JunctionMark({ junction }: { junction: Junction }) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const pulseRef = useRef<HTMLSpanElement>(null);

  // Each junction element mounts the moment two halves start touching, so pulsing on mount is
  // exactly "fire on every new connection" (§5.4) without diffing junction lists by hand.
  useGSAP(
    () => {
      if (!pulseRef.current) return;
      if (junction.match) animateConnectionPulse(pulseRef.current);
      else animateMismatchFlash(pulseRef.current);
    },
    { dependencies: [junction.match], scope: containerRef },
  );

  const midRow = (junction.cellA.row + junction.cellB.row + 1) / 2;
  const midCol = (junction.cellA.col + junction.cellB.col + 1) / 2;

  return (
    <span
      ref={containerRef}
      className="pointer-events-none absolute flex items-center justify-center"
      style={{
        left: `${(midCol / GRID_SIZE) * 100}%`,
        top: `${(midRow / GRID_SIZE) * 100}%`,
        width: `${100 / GRID_SIZE}%`,
        height: `${100 / GRID_SIZE}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <span
        ref={pulseRef}
        className={cn(
          "absolute h-1/2 w-1/2",
          junction.match ? "bg-electric-pulse" : "bg-error-red",
        )}
      />
      <span
        className={cn(
          "absolute h-[14%] w-[14%] border border-broken-black",
          junction.match ? "bg-electric-pulse" : "bg-error-red",
        )}
      />
    </span>
  );
}

/** Live junction feedback: matches pulse electric blue, mismatches flag red without blocking. */
export function ConnectionGlow({ junctions }: { junctions: Junction[] }) {
  return (
    <>
      {junctions.map((junction) => (
        <JunctionMark key={junctionKey(junction)} junction={junction} />
      ))}
    </>
  );
}
