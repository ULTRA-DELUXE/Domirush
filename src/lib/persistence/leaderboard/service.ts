import type { GameModeId, SessionResults } from "../../modes/types";
import { readSettings } from "../localStore";
import { localProvider } from "./localProvider";
import type { LeaderboardEntry, LeaderboardProvider } from "./types";

let activeProvider: LeaderboardProvider = localProvider;

/** Swapping in the remote provider later is a single call, not a refactor (§6.4). */
export function setLeaderboardProvider(provider: LeaderboardProvider): void {
  activeProvider = provider;
}

export function getLeaderboardProvider(): LeaderboardProvider {
  return activeProvider;
}

export async function listLeaderboard(
  modeId: GameModeId,
  scope?: string,
): Promise<LeaderboardEntry[]> {
  try {
    return await activeProvider.listEntries(modeId, scope);
  } catch {
    return [];
  }
}

/**
 * The thin service layer §6.4 asks for: session/results code calls this, never a provider
 * directly, so the store stays provider-agnostic and a failed submit can never break a run.
 */
export async function submitRunToLeaderboard(
  results: SessionResults,
  scope?: string,
): Promise<boolean> {
  try {
    await activeProvider.submitEntry({
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
