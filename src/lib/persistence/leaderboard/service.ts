import type { GameModeId, SessionResults } from "../../modes/types";
import { readSettings } from "../localStore";
import { resolveLeaderboardProvider } from "./index";
import { localProvider } from "./localProvider";
import type { LeaderboardEntry, LeaderboardProvider } from "./types";

let override: LeaderboardProvider | null = null;

/** Tests / rare overrides. Production uses `resolveLeaderboardProvider()`. */
export function setLeaderboardProvider(provider: LeaderboardProvider | null): void {
  override = provider;
}

export function getLeaderboardProvider(): LeaderboardProvider {
  return override ?? resolveLeaderboardProvider();
}

export async function listLeaderboard(
  modeId: GameModeId,
  scope?: string,
): Promise<LeaderboardEntry[]> {
  try {
    return await getLeaderboardProvider().listEntries(modeId, scope);
  } catch {
    return [];
  }
}

/**
 * Thin service layer: session/results never talk to a provider. A failed submit never
 * blocks the results screen or local personal bests.
 */
export async function submitRunToLeaderboard(
  results: SessionResults,
  scope?: string,
): Promise<boolean> {
  if (!results.rankId) return false;
  try {
    await getLeaderboardProvider().submitEntry({
      playerName: readSettings().playerName || "Player",
      modeId: results.modeId,
      scope,
      totalTimeMs: results.totalTimeMs,
      rankId: results.rankId,
    });
    return true;
  } catch {
    return false;
  }
}

export { localProvider };
