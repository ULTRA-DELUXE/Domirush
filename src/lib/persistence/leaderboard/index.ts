import { localProvider } from "./localProvider";
import { remoteProvider } from "./remoteProvider";
import type { LeaderboardProvider } from "./types";

/**
 * Browser → remote (hits `/api/leaderboard`, which no-ops without Supabase env).
 * Server / tests without window → local fallback.
 */
export function resolveLeaderboardProvider(): LeaderboardProvider {
  return typeof window !== "undefined" ? remoteProvider : localProvider;
}

export { localProvider, remoteProvider };
export type { LeaderboardProvider };
