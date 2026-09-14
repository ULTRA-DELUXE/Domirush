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
      <main className="frame-page status-page">
        <section className="status-title-band band-pad">
          <p className="label opacity-55">03 / Results</p>
          <h1 className="display uppercase">No results yet</h1>
        </section>
        <section className="status-body-band band-pad">
          <p className="kicker">Finish a run and your splits will show up here.</p>
          <button type="button" className="btn mt-6" onClick={() => router.push("/")}>
            Back to menu
          </button>
        </section>
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
    <main ref={rootRef} className="frame-page results-page">
      <section className="results-title-band results-title-band--split results-reveal">
        <div className="band-pad flex min-h-0 flex-col justify-between">
          <p className="label opacity-55">03 / {mode?.label ?? results.modeId}</p>
          <div>
            {rank && (
              <>
                <h1 ref={rankRef} className="display">
                  {rank.name}
                </h1>
                <p className="kicker mt-3">{rank.blurb}</p>
              </>
            )}
          </div>
        </div>
        <div className="results-actions band-pad">
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
      </section>

      <div className="results-body results-reveal">
        <section className="results-stats">
          <div className="results-stat band-pad">
            <p className="label opacity-55">Total</p>
            <p className="display-sm">{formatDuration(results.totalTimeMs)}</p>
          </div>
          <div className="results-stat band-pad">
            <p className="label opacity-55">Fastest</p>
            <p className="display-sm">{formatDuration(results.fastestPuzzleMs ?? 0)}</p>
          </div>
          <div className="results-stat band-pad">
            <p className="label opacity-55">Slowest</p>
            <p className="display-sm">{formatDuration(results.slowestPuzzleMs ?? 0)}</p>
          </div>
        </section>

        <section className="results-lower">
          <div className="results-panel band-pad">
            <h2 className="label opacity-55">Splits</h2>
            <ol className="results-panel-body mt-3 flex flex-col">
              {results.puzzleTimesMs.map((time, index) => (
                <li
                  key={index}
                  className="split-row flex items-center justify-between border-t border-navy py-2 first:border-t-0"
                >
                  <span className="label opacity-55">Puzzle {index + 1}</span>
                  <span className="text-lg">{formatDuration(time)}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="results-panel band-pad">
            <h2 className="label opacity-55">Leaderboard</h2>
            {entries.length === 0 ? (
              <p className="mt-3 text-sm opacity-80">No runs recorded yet.</p>
            ) : (
              <ol className="results-panel-body mt-3 flex flex-col">
                {entries.map((entry, index) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between border-t border-navy py-2 first:border-t-0"
                  >
                    <span className="text-sm">
                      {index + 1}. {entry.playerName}
                      {entry.rankId && (
                        <span className="ml-2 opacity-70">{RANKS[entry.rankId].name}</span>
                      )}
                    </span>
                    <span className="text-lg">{formatDuration(entry.totalTimeMs)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
