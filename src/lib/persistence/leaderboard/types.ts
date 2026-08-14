import type { GameModeId } from "../../modes/types";
import type { LeaderboardEntry, LeaderboardSubmitPayload } from "../types";

export interface LeaderboardProvider {
  id: "local" | "remote";
  /**
   * `scope` generalises "which board" beyond mode alone — e.g. a date string for a future
   * daily challenge. Streak modes leave it undefined.
   */
  listEntries(modeId: GameModeId, scope?: string): Promise<LeaderboardEntry[]>;
  submitEntry(entry: LeaderboardSubmitPayload): Promise<void>;
}

export type { LeaderboardEntry, LeaderboardSubmitPayload };
