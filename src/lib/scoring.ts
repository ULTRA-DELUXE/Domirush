import type { GameModeId } from "./modes/types";

export type RankId = "the-flash" | "late-for-work" | "soccer-mom" | "slowpoke";

export interface RankDefinition {
  id: RankId;
  name: string;
  blurb: string;
}

export const RANKS: Record<RankId, RankDefinition> = {
  "the-flash": { id: "the-flash", name: "The Flash", blurb: "Elite. Nobody saw you do it." },
  "late-for-work": { id: "late-for-work", name: "Late for Work", blurb: "Fast. Hustled, not perfect." },
  "soccer-mom": { id: "soccer-mom", name: "Soccer Mom", blurb: "Steady, unbothered, gets it done." },
  slowpoke: { id: "slowpoke", name: "Slowpoke", blurb: "Took your time. No shame in it." },
};

export const RANK_ORDER: RankId[] = ["the-flash", "late-for-work", "soccer-mom", "slowpoke"];

/**
 * Placeholder Alpha thresholds (§3.3): upper bound in ms for each rank, per mode.
 * Derived from an assumed per-puzzle baseline rather than playtesting data — Beta replaces
 * these numbers. Everything rank-related funnels through here so tuning never touches UI code.
 */
const SECONDS = 1000;

const RANK_THRESHOLDS_MS: Record<string, { flash: number; lateForWork: number; soccerMom: number }> = {
  "streak-5": { flash: 125 * SECONDS, lateForWork: 200 * SECONDS, soccerMom: 300 * SECONDS },
  "streak-10": { flash: 280 * SECONDS, lateForWork: 440 * SECONDS, soccerMom: 660 * SECONDS },
  "streak-15": { flash: 465 * SECONDS, lateForWork: 720 * SECONDS, soccerMom: 1080 * SECONDS },
};

/** Falls back to a 25s/40s/60s-per-puzzle curve for modes without an explicit band. */
function thresholdsFor(modeId: GameModeId, puzzleCount: number) {
  return (
    RANK_THRESHOLDS_MS[modeId] ?? {
      flash: puzzleCount * 25 * SECONDS,
      lateForWork: puzzleCount * 40 * SECONDS,
      soccerMom: puzzleCount * 60 * SECONDS,
    }
  );
}

export function getRankForTime(
  modeId: GameModeId,
  totalTimeMs: number,
  puzzleCount = 1,
): RankId {
  const thresholds = thresholdsFor(modeId, puzzleCount);
  if (totalTimeMs <= thresholds.flash) return "the-flash";
  if (totalTimeMs <= thresholds.lateForWork) return "late-for-work";
  if (totalTimeMs <= thresholds.soccerMom) return "soccer-mom";
  return "slowpoke";
}

export function getRankDefinition(rankId: RankId): RankDefinition {
  return RANKS[rankId];
}

export function formatDuration(ms: number): string {
  const safeMs = Math.max(0, Math.round(ms));
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const hundredths = Math.floor((safeMs % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}
