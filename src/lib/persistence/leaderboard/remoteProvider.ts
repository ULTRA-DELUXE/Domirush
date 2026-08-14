import type { LeaderboardEntry, LeaderboardProvider, LeaderboardSubmitPayload } from "./types";

/**
 * STUB — not implemented for v0.7.0 (§6.4, §11 Phase 6). Documented here so a later pass is a
 * drop-in implementation rather than a refactor.
 *
 * Intended contract:
 *   Table `leaderboard_runs(id, player_name, mode_id, scope, total_time_ms, rank, created_at)`
 *   Route `/api/leaderboard` — GET top-N by (mode_id, scope), POST a completed run.
 *   No auth initially; anonymous name entry is enough.
 *
 * Supabase/Prisma are deliberately NOT dependencies until that work actually starts.
 */
export const remoteProvider: LeaderboardProvider = {
  id: "remote",

  async listEntries(): Promise<LeaderboardEntry[]> {
    throw new Error("Remote leaderboard is not implemented in v0.7.0.");
  },

  async submitEntry(_entry: LeaderboardSubmitPayload): Promise<void> {
    throw new Error("Remote leaderboard is not implemented in v0.7.0.");
  },
};
