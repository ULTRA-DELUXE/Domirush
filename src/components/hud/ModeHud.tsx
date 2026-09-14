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
  timersRunning: boolean;
  onAbandon?: () => void;
}

/** Renders whatever the mode's `hud` config asks for — no mode-specific branching here (§7.1). */
export function ModeHud({
  mode,
  position,
  total,
  getPuzzleMs,
  getTotalMs,
  timersRunning,
  onAbandon,
}: ModeHudProps) {
  return (
    <header className="mode-hud">
      <div className="flex min-h-0 min-w-0 flex-col justify-between py-0.5">
        <span className="label opacity-55">02 / Play</span>
        <h1 className="font-display whitespace-nowrap text-[clamp(1.15rem,2vw,1.85rem)] leading-none tracking-[0.08em]">
          {mode.label}
        </h1>
      </div>

      {mode.hud.showProgress && <StreakProgress position={position} total={total} />}
      {mode.hud.showPuzzleTimer && (
        <Timer label="Puzzle" getMs={getPuzzleMs} isRunning={timersRunning} />
      )}
      {mode.hud.showTotalTimer && (
        <Timer label="Total" getMs={getTotalMs} isRunning={timersRunning} emphasis />
      )}
      {onAbandon && (
        <button type="button" className="btn btn-ghost self-stretch" onClick={onAbandon}>
          Abandon
        </button>
      )}
    </header>
  );
}
