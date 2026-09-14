import type { LeaderboardEntry, LeaderboardProvider, LeaderboardSubmitPayload } from "./types";

function asEntries(payload: unknown): LeaderboardEntry[] {
  if (!payload || typeof payload !== "object") return [];
  const entries = (payload as { entries?: unknown }).entries;
  return Array.isArray(entries) ? (entries as LeaderboardEntry[]) : [];
}

export const remoteProvider: LeaderboardProvider = {
  id: "remote",

  async listEntries(modeId, scope) {
    try {
      const params = new URLSearchParams({ modeId });
      if (scope) params.set("scope", scope);
      const res = await fetch(`/api/leaderboard?${params.toString()}`, { cache: "no-store" });
      if (!res.ok) return [];
      return asEntries(await res.json());
    } catch {
      return [];
    }
  },

  async submitEntry(entry: LeaderboardSubmitPayload) {
    try {
      await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
    } catch {
      // Fire-and-forget: a failed submit must never block results or local bests.
    }
  },
};
