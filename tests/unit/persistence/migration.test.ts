import { describe, expect, it } from "vitest";
import { migrateToV2 } from "@/lib/persistence/migration";
import { DEFAULT_SETTINGS } from "@/lib/persistence/types";

describe("persisted data migration", () => {
  it("rekeys v1 streak-length records onto mode ids", () => {
    const migrated = migrateToV2({
      bests: {
        "5": { totalTimeMs: 120_000, rank: "the-flash", achievedAt: 111 },
        "15": { totalTimeMs: 900_000, rank: "slowpoke" },
      },
    });

    expect(migrated.version).toBe(2);
    expect(migrated.records["streak-5"]?.bests).toEqual({
      totalTimeMs: 120_000,
      rankId: "the-flash",
      achievedAt: 111,
    });
    expect(migrated.records["streak-15"]?.bests?.rankId).toBe("slowpoke");
    expect(migrated.records["5"]).toBeUndefined();
  });

  it("keeps v1 settings and backfills missing ones", () => {
    const migrated = migrateToV2({ settings: { autoCheck: false } });
    expect(migrated.settings.autoCheck).toBe(false);
    expect(migrated.settings.playerName).toBe(DEFAULT_SETTINGS.playerName);
  });

  it("drops an unrecognised v1 rank rather than trusting it", () => {
    const migrated = migrateToV2({ bests: { "10": { totalTimeMs: 1, rank: "sonic" } } });
    expect(migrated.records["streak-10"]?.bests?.rankId).toBeNull();
  });

  it("passes a v2 payload through untouched", () => {
    const v2 = {
      version: 2 as const,
      settings: { ...DEFAULT_SETTINGS, playerName: "Ada" },
      records: { "streak-5": { bests: { totalTimeMs: 5, rankId: null, achievedAt: 1 } } },
    };
    expect(migrateToV2(v2)).toEqual(v2);
  });

  it("returns a usable default for garbage input", () => {
    for (const garbage of [null, undefined, 42, "nope", { bests: { "5": null } }]) {
      const migrated = migrateToV2(garbage);
      expect(migrated.version).toBe(2);
      expect(migrated.settings).toEqual(DEFAULT_SETTINGS);
    }
  });
});
