import { RANK_ORDER, type RankId } from "../scoring";
import {
  DEFAULT_SETTINGS,
  EMPTY_PERSISTED_DATA,
  type PersistedDataV1,
  type PersistedDataV2,
} from "./types";

function isRankId(value: unknown): value is RankId {
  return typeof value === "string" && (RANK_ORDER as string[]).includes(value);
}

/** v1 keyed records by streak length ("5"), v2 keys them by mode id ("streak-5"). */
function modeIdForV1Key(key: string): string {
  return /^\d+$/.test(key) ? `streak-${key}` : key;
}

function migrateV1(data: PersistedDataV1): PersistedDataV2 {
  const records: PersistedDataV2["records"] = {};
  for (const [key, best] of Object.entries(data.bests ?? {})) {
    if (!best || typeof best.totalTimeMs !== "number") continue;
    records[modeIdForV1Key(key)] = {
      bests: {
        totalTimeMs: best.totalTimeMs,
        rankId: isRankId(best.rank) ? best.rank : null,
        achievedAt: best.achievedAt ?? 0,
      },
    };
  }

  return {
    version: 2,
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
    records,
  };
}

/**
 * Accepts anything found in localStorage — any version, or garbage — and always returns a
 * valid v2 payload. Persistence must never be able to crash the app on load.
 */
export function migrateToV2(raw: unknown): PersistedDataV2 {
  if (!raw || typeof raw !== "object") return EMPTY_PERSISTED_DATA;

  const data = raw as Partial<PersistedDataV2> & PersistedDataV1;
  if (data.version === 2 && data.records && data.settings) {
    return {
      version: 2,
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
      records: data.records,
    };
  }

  return migrateV1(data as PersistedDataV1);
}
