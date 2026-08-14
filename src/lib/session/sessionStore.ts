import { create } from "zustand";
import { PuzzleGenerationError } from "../domino/generator";
import { requireMode } from "../modes/registry";
import type { GameModeId, PuzzleCompleteResult, SessionResults } from "../modes/types";
import { recordModeBest } from "../persistence/localStore";
import { submitRunToLeaderboard } from "../persistence/leaderboard/service";
import {
  clearStoredResults,
  clearStoredSession,
  readStoredResults,
  readStoredSession,
  writeStoredResults,
  writeStoredSession,
} from "./sessionPersistence";
import { withAdvancedPuzzle, withPuzzleTime, withRestartedPuzzleClock } from "./sessionFlow";
import type { GameSession } from "./types";

export interface SessionState {
  session: GameSession | null;
  results: SessionResults | null;
  /** True while a mode is generating its puzzle queue. */
  isStarting: boolean;
  startError: string | null;
  hydrated: boolean;

  hydrate: () => void;
  startSession: (modeId: GameModeId, seed?: number) => boolean;
  completePuzzle: (puzzleTimeMs: number) => PuzzleCompleteResult;
  finishSession: () => SessionResults | null;
  abandonSession: () => void;
  clearResults: () => void;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000) + 1;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  results: null,
  isStarting: false,
  startError: null,
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ session: readStoredSession(), results: readStoredResults(), hydrated: true });
  },

  startSession: (modeId, seed) => {
    set({ isStarting: true, startError: null });
    try {
      const mode = requireMode(modeId);
      const session = mode.createSession({ seed: seed ?? randomSeed(), now: Date.now() });
      writeStoredSession(session);
      clearStoredResults();
      set({ session, results: null, isStarting: false, startError: null, hydrated: true });
      return true;
    } catch (error) {
      const message =
        error instanceof PuzzleGenerationError
          ? "Puzzle generation failed. Try starting the run again."
          : "Something went wrong starting this run.";
      set({ isStarting: false, startError: message });
      return false;
    }
  },

  completePuzzle: (puzzleTimeMs) => {
    const current = get().session;
    if (!current) return { type: "finish" };

    const mode = requireMode(current.modeId);
    const scored = withPuzzleTime(current, puzzleTimeMs);
    const outcome = mode.onPuzzleComplete(scored, puzzleTimeMs);

    const next = outcome.type === "advance" ? withAdvancedPuzzle(scored, Date.now()) : scored;
    writeStoredSession(next);
    set({ session: next });
    return outcome;
  },

  finishSession: () => {
    const current = get().session;
    if (!current) return null;

    const results = requireMode(current.modeId).onSessionComplete(current);
    if (results) {
      writeStoredResults(results);
      recordModeBest(results.modeId, {
        totalTimeMs: results.totalTimeMs,
        rankId: results.rankId,
        achievedAt: results.completedAt,
      });
      // Fire-and-forget through the service layer; a failed submit never blocks the results screen.
      void submitRunToLeaderboard(results);
    }

    clearStoredSession();
    set({ session: null, results });
    return results;
  },

  abandonSession: () => {
    clearStoredSession();
    set({ session: null });
  },

  clearResults: () => {
    clearStoredResults();
    set({ results: null });
  },
}));

/** Called on resume so a run paused across a refresh doesn't bank the idle time. */
export function resumeSessionClock(): void {
  const { session } = useSessionStore.getState();
  if (!session) return;
  const resumed = withRestartedPuzzleClock(session, Date.now());
  writeStoredSession(resumed);
  useSessionStore.setState({ session: resumed });
}
