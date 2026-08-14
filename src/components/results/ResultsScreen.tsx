"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playScreenEnter, revealRankName, revealRows, useGSAP } from "@/lib/animations";
import { getMode } from "@/lib/modes";
import { listLeaderboard } from "@/lib/persistence/leaderboard/service";
import type { LeaderboardEntry } from "@/lib/persistence/types";
import { RANKS, formatDuration } from "@/lib/scoring";
import { useSessionStore } from "@/lib/session/sessionStore";

export function ResultsScreen() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const rankRef = useRef<HTMLHeadingElement>(null);

  const results = useSessionStore((state) => state.results);
  const hydrated = useSessionStore((state) => state.hydrated);
  const hydrate = useSessionStore((state) => state.hydrate);
  const startSession = useSessionStore((state) => state.startSession);
  const clearResults = useSessionStore((state) => state.clearResults);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!results) return;
    let active = true;
    // Reads through the provider interface, so a remote board later needs no change here (§6.4).
    listLeaderboard(results.modeId).then((rows) => {
      if (active) setEntries(rows);
    });
    return () => {
      active = false;
    };
  }, [results]);

  useGSAP(
    () => {
      if (!results || !rootRef.current) return;
      playScreenEnter(rootRef.current.querySelectorAll(".results-reveal"));
      if (rankRef.current) revealRankName(rankRef.current);
      revealRows(rootRef.current.querySelectorAll(".split-row"));
    },
    { dependencies: [results?.sessionId], scope: rootRef },
  );

  if (hydrated && !results) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-start justify-center gap-6 p-8">
        <h1 className="font-display text-5xl">No results yet</h1>
        <p className="text-lg opacity-90">Finish a run and your splits will show up here.</p>
        <button type="button" className="btn" onClick={() => router.push("/")}>
          Back to menu
        </button>
      </main>
    );
  }

  if (!results) return null;

  const mode = getMode(results.modeId);
  const rank = results.rankId ? RANKS[results.rankId] : null;

  const replay = () => {
    clearResults();
    if (startSession(results.modeId)) router.push(`/play/${results.modeId}`);
  };

  return (
    <main ref={rootRef} className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6 lg:p-12">
      <section className="results-reveal">
        <p className="label opacity-70">{mode?.label ?? results.modeId} complete</p>
        {rank && (
          <>
            <h1 ref={rankRef} className="font-display text-6xl leading-none lg:text-8xl">
              {rank.name}
            </h1>
            <p className="mt-3 text-lg opacity-90">{rank.blurb}</p>
          </>
        )}
      </section>

      <section className="results-reveal card grid gap-6 p-6 sm:grid-cols-3">
        <div>
          <p className="label opacity-70">Total</p>
          <p className="font-display text-4xl leading-none">
            {formatDuration(results.totalTimeMs)}
          </p>
        </div>
        <div>
          <p className="label opacity-70">Fastest puzzle</p>
          <p className="text-2xl">{formatDuration(results.fastestPuzzleMs ?? 0)}</p>
        </div>
        <div>
          <p className="label opacity-70">Slowest puzzle</p>
          <p className="text-2xl">{formatDuration(results.slowestPuzzleMs ?? 0)}</p>
        </div>
      </section>

      <section className="results-reveal card p-6">
        <h2 className="font-display text-2xl">Splits</h2>
        <ol className="mt-4 flex flex-col">
          {results.puzzleTimesMs.map((time, index) => (
            <li
              key={index}
              className="split-row flex items-center justify-between border-t border-broken-black py-2 first:border-t-0"
            >
              <span className="label opacity-70">Puzzle {index + 1}</span>
              <span className="text-lg">{formatDuration(time)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="results-reveal card p-6">
        <h2 className="font-display text-2xl">Local leaderboard</h2>
        {entries.length === 0 ? (
          <p className="mt-3 text-base opacity-80">No runs recorded yet.</p>
        ) : (
          <ol className="mt-4 flex flex-col">
            {entries.map((entry, index) => (
              <li
                key={entry.id}
                className="flex items-center justify-between border-t border-broken-black py-2 first:border-t-0"
              >
                <span className="text-base">
                  {index + 1}. {entry.playerName}
                  {entry.rankId && (
                    <span className="ml-2 text-sm opacity-70">{RANKS[entry.rankId].name}</span>
                  )}
                </span>
                <span className="text-lg">{formatDuration(entry.totalTimeMs)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <div className="results-reveal flex flex-wrap gap-3">
        <button type="button" className="btn" onClick={replay}>
          Run it again
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            clearResults();
            router.push("/");
          }}
        >
          Back to menu
        </button>
      </div>
    </main>
  );
}
