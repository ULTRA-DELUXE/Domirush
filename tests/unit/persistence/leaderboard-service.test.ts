import { afterEach, describe, expect, it, vi } from "vitest";
import {
  listLeaderboard,
  setLeaderboardProvider,
  submitRunToLeaderboard,
} from "@/lib/persistence/leaderboard/service";
import type { SessionResults } from "@/lib/modes/types";

const results: SessionResults = {
  sessionId: "session-1",
  modeId: "streak-5",
  totalTimeMs: 12_000,
  fastestPuzzleMs: 2_000,
  slowestPuzzleMs: 4_000,
  puzzleTimesMs: [2_000, 3_000, 3_000, 2_000, 2_000],
  rankId: "the-flash",
  completedAt: Date.now(),
};

afterEach(() => {
  setLeaderboardProvider(null);
});

describe("leaderboard service isolation", () => {
  it("returns an empty list when the provider throws", async () => {
    setLeaderboardProvider({
      id: "remote",
      listEntries: async () => {
        throw new Error("down");
      },
      submitEntry: async () => {
        throw new Error("down");
      },
    });

    await expect(listLeaderboard("streak-5")).resolves.toEqual([]);
  });

  it("returns false when submit throws and does not rethrow", async () => {
    setLeaderboardProvider({
      id: "remote",
      listEntries: async () => [],
      submitEntry: async () => {
        throw new Error("down");
      },
    });

    await expect(submitRunToLeaderboard(results)).resolves.toBe(false);
  });

  it("skips submit when the run has no rank", async () => {
    const submitEntry = vi.fn();
    setLeaderboardProvider({
      id: "remote",
      listEntries: async () => [],
      submitEntry,
    });

    await expect(submitRunToLeaderboard({ ...results, rankId: null })).resolves.toBe(false);
    expect(submitEntry).not.toHaveBeenCalled();
  });
});
