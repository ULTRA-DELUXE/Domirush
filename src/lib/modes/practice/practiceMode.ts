import { getDifficultyForPosition } from "../../domino/difficulty";
import { generatePuzzle } from "../../domino/generator";
import type { GameModeDefinition } from "../types";

/**
 * Stub mode (§7.1): a single untimed, unscored puzzle. It ships menu-hidden and exists to prove
 * the registry genuinely extends — a new mode is one definition, with no engine, play-shell, or
 * persistence changes. Its gameplay beyond "one puzzle" is deliberately not built out.
 */
export const practiceMode: GameModeDefinition = {
  id: "practice",
  label: "Practice",
  description: "One puzzle, no clock, no rank.",
  puzzlePolicy: "single",
  scoringPolicy: "none",
  hiddenFromMenu: true,
  hud: { showPuzzleTimer: false, showTotalTimer: false, showProgress: false, showHint: true },

  createSession: ({ seed, now }) => ({
    id: `practice-${now}-${seed}`,
    modeId: "practice",
    puzzles: [generatePuzzle({ ...getDifficultyForPosition(3), seed }).puzzle],
    currentPuzzleIndex: 0,
    puzzleTimesMs: [],
    startedAt: now,
    currentPuzzleStartedAt: now,
    meta: { seed },
  }),

  onPuzzleComplete: () => ({ type: "finish" }),
  onSessionComplete: () => null,
};
