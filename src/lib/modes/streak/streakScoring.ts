import { getRankForTime } from "../../scoring";
import type { GameSession } from "../../session/types";
import type { SessionResults } from "../types";

export function summariseStreak(session: GameSession): SessionResults | null {
  if (session.puzzleTimesMs.length === 0) return null;

  const totalTimeMs = session.puzzleTimesMs.reduce((sum, time) => sum + time, 0);
  return {
    sessionId: session.id,
    modeId: session.modeId,
    totalTimeMs,
    puzzleTimesMs: [...session.puzzleTimesMs],
    rankId: getRankForTime(session.modeId, totalTimeMs, session.puzzles.length),
    fastestPuzzleMs: Math.min(...session.puzzleTimesMs),
    slowestPuzzleMs: Math.max(...session.puzzleTimesMs),
    completedAt: Date.now(),
  };
}
