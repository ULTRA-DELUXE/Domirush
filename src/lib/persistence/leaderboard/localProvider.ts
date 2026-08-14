import type { GameModeId } from "../../modes/types";
import { appendLocalLeaderboardEntry, readLocalLeaderboard } from "../localStore";
import type { LeaderboardEntry, LeaderboardProvider, LeaderboardSubmitPayload } from "./types";

function createEntryId(): string {
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Default provider: localStorage only, zero network calls (§6.4). */
export const localProvider: LeaderboardProvider = {
  id: "local",

  async listEntries(modeId: GameModeId, scope?: string): Promise<LeaderboardEntry[]> {
    return readLocalLeaderboard(modeId, scope);
  },

  async submitEntry(entry: LeaderboardSubmitPayload): Promise<void> {
    appendLocalLeaderboardEntry({ ...entry, id: createEntryId(), createdAt: Date.now() });
  },
};
