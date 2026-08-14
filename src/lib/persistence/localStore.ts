import { migrateToV2 } from "./migration";
import {
  EMPTY_PERSISTED_DATA,
  type GameSettings,
  type LeaderboardEntry,
  type ModeBest,
  type PersistedDataV2,
} from "./types";

export const STORAGE_KEY = "domirush:data";

const MAX_LEADERBOARD_ENTRIES = 10;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readPersistedData(): PersistedDataV2 {
  if (!isBrowser()) return EMPTY_PERSISTED_DATA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_PERSISTED_DATA;

    const parsed = JSON.parse(raw);
    const migrated = migrateToV2(parsed);
    // Only rewrite when the payload actually changed shape. Settings are read on every
    // placement, so an unconditional write here would thrash localStorage mid-drag.
    if (parsed?.version !== 2) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return EMPTY_PERSISTED_DATA;
  }
}

export function writePersistedData(data: PersistedDataV2): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked (private mode) — the game stays fully playable without it.
  }
}

export function updatePersistedData(
  update: (data: PersistedDataV2) => PersistedDataV2,
): PersistedDataV2 {
  const next = update(readPersistedData());
  writePersistedData(next);
  return next;
}

export function readSettings(): GameSettings {
  return readPersistedData().settings;
}

export function saveSettings(settings: Partial<GameSettings>): GameSettings {
  return updatePersistedData((data) => ({
    ...data,
    settings: { ...data.settings, ...settings },
  })).settings;
}

export function getModeBest(modeId: string): ModeBest | undefined {
  return readPersistedData().records[modeId]?.bests;
}

/** Returns true when the run beat the stored best (or set the first one). */
export function recordModeBest(modeId: string, best: ModeBest): boolean {
  const existing = getModeBest(modeId);
  const isImprovement = !existing || best.totalTimeMs < existing.totalTimeMs;
  if (!isImprovement) return false;

  updatePersistedData((data) => ({
    ...data,
    records: { ...data.records, [modeId]: { ...data.records[modeId], bests: best } },
  }));
  return true;
}

export function readLocalLeaderboard(modeId: string, scope?: string): LeaderboardEntry[] {
  const entries = readPersistedData().records[modeId]?.localLeaderboard ?? [];
  return entries
    .filter((entry) => entry.scope === scope)
    .sort((a, b) => a.totalTimeMs - b.totalTimeMs);
}

export function appendLocalLeaderboardEntry(entry: LeaderboardEntry): void {
  updatePersistedData((data) => {
    const record = data.records[entry.modeId] ?? {};
    const entries = [...(record.localLeaderboard ?? []), entry]
      .sort((a, b) => a.totalTimeMs - b.totalTimeMs)
      .slice(0, MAX_LEADERBOARD_ENTRIES);
    return {
      ...data,
      records: { ...data.records, [entry.modeId]: { ...record, localLeaderboard: entries } },
    };
  });
}
