import type { PuzzleDefinition } from "../domino/types";
import type { RankId } from "../scoring";
import type { GameSession } from "../session/types";

export type GameModeId = "streak-5" | "streak-10" | "streak-15" | "practice" | "daily";

export type PuzzlePolicy = "preloaded-finite" | "on-demand-infinite" | "single";

export type ScoringPolicy = "rank-timed" | "time-only" | "none";

export interface ModeHudConfig {
  showPuzzleTimer: boolean;
  showTotalTimer: boolean;
  showProgress: boolean;
  showHint: boolean;
}

export interface ModeCreateContext {
  seed: number;
  now: number;
}

export type PuzzleCompleteResult = { type: "advance" } | { type: "finish" } | { type: "retry" };

export interface SessionResults {
  sessionId: string;
  modeId: GameModeId;
  totalTimeMs: number;
  puzzleTimesMs: number[];
  rankId: RankId | null;
  fastestPuzzleMs: number | null;
  slowestPuzzleMs: number | null;
  completedAt: number;
}

export interface GameModeDefinition {
  id: GameModeId;
  label: string;
  description: string;
  puzzlePolicy: PuzzlePolicy;
  scoringPolicy: ScoringPolicy;
  /** Hidden modes exist to prove the registry extends, without shipping as player-facing. */
  hiddenFromMenu?: boolean;
  createSession: (ctx: ModeCreateContext) => GameSession;
  onPuzzleComplete: (session: GameSession, puzzleTimeMs: number) => PuzzleCompleteResult;
  onSessionComplete: (session: GameSession) => SessionResults | null;
  hud: ModeHudConfig;
}

export type { PuzzleDefinition };
