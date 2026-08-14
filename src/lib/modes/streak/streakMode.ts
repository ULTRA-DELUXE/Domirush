import type { GameSession, StreakSessionMeta } from "../../session/types";
import type { GameModeDefinition, GameModeId } from "../types";
import { buildStreakPuzzles } from "./streakSession";
import { summariseStreak } from "./streakScoring";

function createStreakMode(streakLength: number): GameModeDefinition {
  const id = `streak-${streakLength}` as GameModeId;

  return {
    id,
    label: `${streakLength} Puzzle Streak`,
    description: `Solve ${streakLength} puzzles back to back. The clock never stops.`,
    puzzlePolicy: "preloaded-finite",
    scoringPolicy: "rank-timed",
    hud: { showPuzzleTimer: true, showTotalTimer: true, showProgress: true, showHint: true },

    createSession: ({ seed, now }) => {
      const meta: StreakSessionMeta = { streakLength, seed };
      return {
        id: `${id}-${now}-${seed}`,
        modeId: id,
        puzzles: buildStreakPuzzles(streakLength, seed),
        currentPuzzleIndex: 0,
        puzzleTimesMs: [],
        startedAt: now,
        currentPuzzleStartedAt: now,
        meta,
      };
    },

    onPuzzleComplete: (session: GameSession) =>
      session.currentPuzzleIndex + 1 >= session.puzzles.length
        ? { type: "finish" }
        : { type: "advance" },

    onSessionComplete: summariseStreak,
  };
}

export const streakModes = [createStreakMode(5), createStreakMode(10), createStreakMode(15)];
