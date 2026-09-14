import { beforeEach, describe, expect, it } from "vitest";
import "@/lib/modes";
import { useSessionStore, resumeSessionClock } from "@/lib/session/sessionStore";
import {
  readStoredResults,
  readStoredSession,
  writeStoredSession,
} from "@/lib/session/sessionPersistence";
import { getCurrentPuzzle, getPuzzlePosition } from "@/lib/session/sessionFlow";

function resetStores() {
  window.sessionStorage.clear();
  window.localStorage.clear();
  useSessionStore.setState({
    session: null,
    results: null,
    isStarting: false,
    startError: null,
    hydrated: false,
  });
}

describe("session store lifecycle", () => {
  beforeEach(resetStores);

  it("starts a run and persists it to sessionStorage", () => {
    const started = useSessionStore.getState().startSession("streak-5");
    expect(started).toBe(true);

    const { session } = useSessionStore.getState();
    expect(session?.modeId).toBe("streak-5");
    expect(session?.puzzles).toHaveLength(5);
    expect(readStoredSession()?.id).toBe(session?.id);
  });

  it("advances through puzzles, then finishes on the last one", () => {
    const store = useSessionStore.getState();
    store.startSession("streak-5");

    for (let index = 0; index < 4; index += 1) {
      expect(useSessionStore.getState().completePuzzle(10_000)).toEqual({ type: "advance" });
      expect(getPuzzlePosition(useSessionStore.getState().session!).position).toBe(index + 2);
    }

    expect(useSessionStore.getState().completePuzzle(10_000)).toEqual({ type: "finish" });
  });

  it("produces persisted, ranked results on finish and clears the live session", () => {
    const store = useSessionStore.getState();
    store.startSession("streak-5");
    for (let index = 0; index < 5; index += 1) {
      useSessionStore.getState().completePuzzle(20_000);
    }

    const results = useSessionStore.getState().finishSession();
    expect(results?.totalTimeMs).toBe(100_000);
    expect(results?.rankId).toBe("the-flash");

    // Results outlive the session so a refresh on /results still shows the run (§9.4).
    expect(readStoredResults()?.sessionId).toBe(results?.sessionId);
    expect(readStoredSession()).toBeNull();
    expect(useSessionStore.getState().session).toBeNull();
  });

  it("records a personal best on finish without depending on the global board", async () => {
    const store = useSessionStore.getState();
    store.startSession("streak-5");
    for (let index = 0; index < 5; index += 1) {
      useSessionStore.getState().completePuzzle(20_000);
    }
    useSessionStore.getState().finishSession();

    const { getModeBest } = await import("@/lib/persistence/localStore");

    expect(getModeBest("streak-5")?.totalTimeMs).toBe(100_000);
  });

  it("resumes an interrupted run from sessionStorage", () => {
    useSessionStore.getState().startSession("streak-10");
    const original = useSessionStore.getState().session!;
    useSessionStore.getState().completePuzzle(5_000);

    // Simulate a refresh: fresh store, same storage.
    useSessionStore.setState({ session: null, results: null, hydrated: false });
    useSessionStore.getState().hydrate();

    const resumed = useSessionStore.getState().session;
    expect(resumed?.id).toBe(original.id);
    expect(resumed?.currentPuzzleIndex).toBe(1);
    expect(getCurrentPuzzle(resumed!)?.id).toBe(original.puzzles[1].id);
  });

  it("does not bank idle time across a resume", () => {
    useSessionStore.getState().startSession("streak-5");
    writeStoredSession({
      ...useSessionStore.getState().session!,
      currentPuzzleStartedAt: Date.now() - 600_000,
    });
    useSessionStore.setState({ session: null, hydrated: false });
    useSessionStore.getState().hydrate();

    resumeSessionClock();
    const elapsed = Date.now() - useSessionStore.getState().session!.currentPuzzleStartedAt;
    expect(elapsed).toBeLessThan(1_000);
  });

  it("abandons only on explicit request", () => {
    useSessionStore.getState().startSession("streak-15");
    expect(readStoredSession()).not.toBeNull();

    useSessionStore.getState().abandonSession();
    expect(useSessionStore.getState().session).toBeNull();
    expect(readStoredSession()).toBeNull();
  });

  it("surfaces a retryable error instead of throwing on an unknown mode", () => {
    const started = useSessionStore.getState().startSession("streak-99" as never);
    expect(started).toBe(false);
    expect(useSessionStore.getState().startError).toBeTruthy();
    expect(useSessionStore.getState().session).toBeNull();
  });
});
