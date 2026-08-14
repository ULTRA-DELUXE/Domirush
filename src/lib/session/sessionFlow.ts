import type { PuzzleDefinition } from "../domino/types";
import type { GameSession } from "./types";

export function getCurrentPuzzle(session: GameSession): PuzzleDefinition | null {
  return session.puzzles[session.currentPuzzleIndex] ?? null;
}

export function getPuzzlePosition(session: GameSession): { position: number; total: number } {
  return { position: session.currentPuzzleIndex + 1, total: session.puzzles.length };
}

export function getElapsedPuzzleMs(session: GameSession, now: number): number {
  return Math.max(0, now - session.currentPuzzleStartedAt);
}

/** Completed puzzles only — the in-progress puzzle is added by the live HUD timer. */
export function getCompletedTimeMs(session: GameSession): number {
  return session.puzzleTimesMs.reduce((sum, time) => sum + time, 0);
}

export function getTotalElapsedMs(session: GameSession, now: number): number {
  return getCompletedTimeMs(session) + getElapsedPuzzleMs(session, now);
}

export function isSessionComplete(session: GameSession): boolean {
  return session.puzzleTimesMs.length >= session.puzzles.length;
}

/** Records a solved puzzle without advancing — advancing is the mode's decision. */
export function withPuzzleTime(session: GameSession, puzzleTimeMs: number): GameSession {
  return { ...session, puzzleTimesMs: [...session.puzzleTimesMs, Math.max(0, puzzleTimeMs)] };
}

export function withAdvancedPuzzle(session: GameSession, now: number): GameSession {
  return {
    ...session,
    currentPuzzleIndex: Math.min(session.currentPuzzleIndex + 1, session.puzzles.length - 1),
    currentPuzzleStartedAt: now,
  };
}

/** Restarts the clock on the current puzzle, e.g. after a resume from sessionStorage. */
export function withRestartedPuzzleClock(session: GameSession, now: number): GameSession {
  return { ...session, currentPuzzleStartedAt: now };
}
