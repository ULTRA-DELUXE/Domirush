"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playScreenEnter, useGSAP } from "@/lib/animations";
import { getMode, listModes } from "@/lib/modes";
import type { GameModeDefinition } from "@/lib/modes/types";
import { getModeBest, readSettings, saveSettings } from "@/lib/persistence/localStore";
import type { GameSettings, ModeBest } from "@/lib/persistence/types";
import { RANKS, formatDuration } from "@/lib/scoring";
import { getPuzzlePosition } from "@/lib/session/sessionFlow";
import { useSessionStore } from "@/lib/session/sessionStore";

export function MainMenu() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);

  const session = useSessionStore((state) => state.session);
  const hydrated = useSessionStore((state) => state.hydrated);
  const hydrate = useSessionStore((state) => state.hydrate);
  const startSession = useSessionStore((state) => state.startSession);
  const abandonSession = useSessionStore((state) => state.abandonSession);
  const isStarting = useSessionStore((state) => state.isStarting);
  const startError = useSessionStore((state) => state.startError);

  const [bests, setBests] = useState<Record<string, ModeBest | undefined>>({});
  const [settings, setSettings] = useState<GameSettings | null>(null);

  const modes = listModes();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // localStorage is client-only, so records are read after mount rather than during render.
  useEffect(() => {
    setSettings(readSettings());
    setBests(Object.fromEntries(modes.map((mode) => [mode.id, getModeBest(mode.id)])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useGSAP(
    () => {
      if (rootRef.current) playScreenEnter(rootRef.current.querySelectorAll(".menu-reveal"));
    },
    { dependencies: [hydrated], scope: rootRef },
  );

  const start = (mode: GameModeDefinition) => {
    if (startSession(mode.id)) router.push(`/play/${mode.id}`);
  };

  const updateSetting = (patch: Partial<GameSettings>) => setSettings(saveSettings(patch));

  return (
    <main ref={rootRef} className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-10 p-6 lg:p-12">
      <header className="menu-reveal">
        <h1 className="font-display text-6xl leading-none lg:text-8xl">Domirush</h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed opacity-90">
          Bridge two points on an 8×8 grid with dominoes. Touching halves must match. Solve the
          whole streak before the clock makes a fool of you.
        </p>
      </header>

      {/* An interrupted run is never discarded silently — the player chooses (§9.1). */}
      {hydrated && session && (
        <section className="menu-reveal card p-6">
          <h2 className="font-display text-2xl">Run in progress</h2>
          <p className="mt-2 text-base">
            {getMode(session.modeId)?.label ?? session.modeId} — puzzle{" "}
            {getPuzzlePosition(session).position} of {getPuzzlePosition(session).total}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn"
              onClick={() => router.push(`/play/${session.modeId}`)}
            >
              Continue run
            </button>
            <button type="button" className="btn" onClick={abandonSession}>
              Abandon
            </button>
          </div>
        </section>
      )}

      {startError && (
        <p role="alert" className="menu-reveal card border-error-red p-4 text-error-red">
          {startError}
        </p>
      )}

      <section className="menu-reveal grid gap-5 md:grid-cols-3">
        {modes.map((mode) => {
          const best = bests[mode.id];
          return (
            <article key={mode.id} className="card flex flex-col justify-between gap-5 p-6">
              <div>
                <h2 className="font-display text-3xl leading-none">{mode.label}</h2>
                <p className="mt-3 text-sm leading-relaxed">{mode.description}</p>
              </div>

              <dl className="text-sm">
                <dt className="label opacity-70">Best</dt>
                <dd className="text-lg">
                  {best ? formatDuration(best.totalTimeMs) : "—"}
                  {best?.rankId && (
                    <span className="ml-2 text-sm opacity-70">{RANKS[best.rankId].name}</span>
                  )}
                </dd>
              </dl>

              <button
                type="button"
                className="btn"
                disabled={isStarting}
                onClick={() => start(mode)}
              >
                {isStarting ? "Generating…" : "Start run"}
              </button>
            </article>
          );
        })}
      </section>

      {settings && (
        <section className="menu-reveal card p-6">
          <h2 className="font-display text-2xl">Settings</h2>
          <div className="mt-4 flex flex-col gap-4">
            <label className="flex items-center gap-3 text-base">
              <input
                type="checkbox"
                className="h-5 w-5 accent-shocking-blue"
                checked={settings.autoCheck}
                onChange={(event) => updateSetting({ autoCheck: event.target.checked })}
              />
              Check the path automatically after every placement
            </label>

            <label className="flex items-center gap-3 text-base">
              <span className="label opacity-70">Name</span>
              <input
                type="text"
                className="border-2 border-broken-black bg-transparent px-3 py-1"
                value={settings.playerName}
                maxLength={16}
                onChange={(event) => updateSetting({ playerName: event.target.value })}
              />
            </label>
          </div>
        </section>
      )}
    </main>
  );
}
