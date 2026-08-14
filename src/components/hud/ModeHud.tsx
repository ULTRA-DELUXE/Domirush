"use client";

import type { GameModeDefinition } from "@/lib/modes/types";
import { StreakProgress } from "./StreakProgress";
import { Timer } from "./Timer";

export interface ModeHudProps {
  mode: GameModeDefinition;
  position: number;
  total: number;
  getPuzzleMs: () => number;
  getTotalMs: () => number;
}

/** Renders whatever the mode's `hud` config asks for — no mode-specific branching here (§7.1). */
export function ModeHud({ mode, position, total, getPuzzleMs, getTotalMs }: ModeHudProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 border-2 border-broken-black bg-broken-white/10 px-5 py-4">
      <div className="flex flex-col gap-1">
        <span className="label opacity-70">Mode</span>
        <h1 className="font-display text-2xl leading-none">{mode.label}</h1>
      </div>

      {mode.hud.showProgress && <StreakProgress position={position} total={total} />}
      {mode.hud.showPuzzleTimer && <Timer label="This puzzle" getMs={getPuzzleMs} />}
      {mode.hud.showTotalTimer && <Timer label="Total" getMs={getTotalMs} emphasis />}
    </header>
  );
}
