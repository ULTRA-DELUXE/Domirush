"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { GameModeDefinition } from "@/lib/modes/types";
import { getCurrentPuzzle, getPuzzlePosition } from "@/lib/session/sessionFlow";
import { resumeSessionClock, useSessionStore } from "@/lib/session/sessionStore";
import { useGameStore } from "@/lib/state/gameStore";
import type { PuzzleDefinition } from "@/lib/domino/types";

export type PlayPhase = "hydrating" | "generating" | "error" | "ready";

export interface GameSessionFlow {
  phase: PlayPhase;
  error: string | null;
  puzzle: PuzzleDefinition | null;
  position: number;
  total: number;
  retry: () => void;
  abandon: () => void;
  /** Call once the win celebration has finished playing. */
  completeCurrentPuzzle: () => void;
}

/**
 * Owns the session lifecycle for the play screen (§7.1): start or resume a run, feed the board
 * store one puzzle at a time, and on a solve either advance or finish and navigate to results.
 * Kept out of PlayShell so rendering and lifecycle don't tangle.
 */
export function useGameSessionFlow(mode: GameModeDefinition): GameSessionFlow {
  const router = useRouter();

  const session = useSessionStore((state) => state.session);
  const hydrated = useSessionStore((state) => state.hydrated);
  const isStarting = useSessionStore((state) => state.isStarting);
  const startError = useSessionStore((state) => state.startError);
  const hydrate = useSessionStore((state) => state.hydrate);
  const startSession = useSessionStore((state) => state.startSession);
  const loadPuzzle = useGameStore((state) => state.loadPuzzle);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Start a run when arriving without one — e.g. a direct link to /play/streak-10. An existing
  // run for this mode is resumed instead, with its clock restarted so time spent away from the
  // tab isn't charged to the player.
  useEffect(() => {
    if (!hydrated || isStarting || startError) return;
    const current = useSessionStore.getState().session;
    if (!current || current.modeId !== mode.id) startSession(mode.id);
    else resumeSessionClock();
  }, [hydrated, isStarting, startError, mode.id, startSession]);

  const activePuzzle = session ? getCurrentPuzzle(session) : null;
  const puzzleId = activePuzzle?.id ?? null;

  // Keyed on puzzle id so advancing loads the next board exactly once.
  useEffect(() => {
    const current = useSessionStore.getState().session;
    const puzzle = current ? getCurrentPuzzle(current) : null;
    if (puzzle) loadPuzzle(puzzle);
  }, [puzzleId, loadPuzzle]);

  const retry = useCallback(() => {
    useSessionStore.setState({ startError: null });
    startSession(mode.id);
  }, [mode.id, startSession]);

  const abandon = useCallback(() => {
    useSessionStore.getState().abandonSession();
    router.push("/");
  }, [router]);

  const completeCurrentPuzzle = useCallback(() => {
    const store = useSessionStore.getState();
    const current = store.session;
    if (!current) return;

    const solvedAt = useGameStore.getState().solvedAt ?? Date.now();
    const outcome = store.completePuzzle(solvedAt - current.currentPuzzleStartedAt);

    if (outcome.type === "finish") {
      const results = store.finishSession();
      router.push(results ? "/results" : "/");
    }
  }, [router]);

  const { position, total } = session
    ? getPuzzlePosition(session)
    : { position: 0, total: mode.puzzlePolicy === "single" ? 1 : 0 };

  const phase: PlayPhase = startError
    ? "error"
    : !hydrated || isStarting
      ? isStarting
        ? "generating"
        : "hydrating"
      : activePuzzle
        ? "ready"
        : "generating";

  return {
    phase,
    error: startError,
    puzzle: activePuzzle,
    position,
    total,
    retry,
    abandon,
    completeCurrentPuzzle,
  };
}
