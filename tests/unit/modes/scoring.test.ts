import { describe, expect, it } from "vitest";
import { RANK_ORDER, formatDuration, getRankForTime } from "@/lib/scoring";

describe("rank thresholds", () => {
  it("assigns every band for a 5-puzzle streak", () => {
    expect(getRankForTime("streak-5", 60_000)).toBe("the-flash");
    expect(getRankForTime("streak-5", 180_000)).toBe("late-for-work");
    expect(getRankForTime("streak-5", 280_000)).toBe("soccer-mom");
    expect(getRankForTime("streak-5", 900_000)).toBe("slowpoke");
  });

  it("scales thresholds with streak length", () => {
    const time = 310_000;
    expect(getRankForTime("streak-5", time)).toBe("slowpoke");
    expect(getRankForTime("streak-15", time)).toBe("the-flash");
  });

  it("is monotonic — slower time never earns a better rank", () => {
    let previous = 0;
    for (let ms = 0; ms <= 1_200_000; ms += 10_000) {
      const rank = RANK_ORDER.indexOf(getRankForTime("streak-10", ms));
      expect(rank).toBeGreaterThanOrEqual(previous);
      previous = rank;
    }
  });

  it("falls back to a per-puzzle baseline for modes without a band", () => {
    expect(getRankForTime("practice", 20_000, 1)).toBe("the-flash");
    expect(getRankForTime("practice", 120_000, 1)).toBe("slowpoke");
  });

  it("formats durations as speedrun-style splits", () => {
    expect(formatDuration(0)).toBe("00:00.00");
    expect(formatDuration(65_430)).toBe("01:05.43");
    expect(formatDuration(-5)).toBe("00:00.00");
  });
});
