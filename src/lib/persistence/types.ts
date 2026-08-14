import type { GameModeId } from "../modes/types";
import type { RankId } from "../scoring";

export interface GameSettings {
  /** Re-check the board after every placement instead of only on "Check Path" (§2.4). */
  autoCheck: boolean;
  sound: boolean;
  playerName: string;
}

export interface ModeBest {
  totalTimeMs: number;
  rankId: RankId | null;
  achievedAt: number;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  modeId: GameModeId;
  scope?: string;
  totalTimeMs: number;
  rankId: RankId | null;
  createdAt: number;
}

export type LeaderboardSubmitPayload = Omit<LeaderboardEntry, "id" | "createdAt">;

export interface ModeRecord {
  bests?: ModeBest;
  localLeaderboard?: LeaderboardEntry[];
}

export interface PersistedDataV2 {
  version: 2;
  settings: GameSettings;
  /** Keyed by GameModeId, so a new mode adds a key rather than a schema change. */
  records: Record<string, ModeRecord>;
}

/**
 * Pre-mode-registry shape, keyed by streak length rather than mode id. No shipped build ever
 * wrote this, but the migration path is kept so the versioning story is real rather than
 * theoretical, and so a stray v1 payload can never crash a player's client.
 */
export interface PersistedDataV1 {
  version?: 1;
  settings?: Partial<GameSettings>;
  bests?: Record<string, { totalTimeMs: number; rank?: string | null; achievedAt?: number }>;
}

export const DEFAULT_SETTINGS: GameSettings = {
  autoCheck: true,
  sound: false,
  playerName: "Player",
};

export const EMPTY_PERSISTED_DATA: PersistedDataV2 = {
  version: 2,
  settings: DEFAULT_SETTINGS,
  records: {},
};
