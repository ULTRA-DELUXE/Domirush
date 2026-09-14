"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playScreenEnter, useGSAP } from "@/lib/animations";
import { getMode, listModes } from "@/lib/modes";
import type { GameModeDefinition } from "@/lib/modes/types";
import { getModeBest, readSettings, saveSettings } from "@/lib/persistence/localStore";
import { DEFAULT_SETTINGS, type GameSettings, type ModeBest } from "@/lib/persistence/types";
import { RANKS, formatDuration } from "@/lib/scoring";
import { getPuzzlePosition } from "@/lib/session/sessionFlow";
import { useSessionStore } from "@/lib/session/sessionStore";
import { cn } from "@/lib/utils/cn";

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
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  const modes = listModes();
  const showContinue = hydrated && session;

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
    <main ref={rootRef} className="frame-page menu-page">
      <section
        className={cn("menu-title-band menu-reveal", showContinue && "menu-title-band--split")}
      >
        <div className="menu-title-copy band-pad">
          <p className="label opacity-55">01 / Menu</p>
          <div>
            <h1 className="display uppercase">Domirush</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed tracking-[0.04em] opacity-70">
              Bridge two points on an 8×8 grid. Touching halves must match.
            </p>
            {startError && (
              <p role="alert" className="kicker mt-3 text-navy">
                <span className="inline-block border border-navy bg-gold px-3 py-1 text-navy">
                  {startError}
                </span>
              </p>
            )}
          </div>
        </div>

        {showContinue && session && (
          <aside className="menu-continue band-pad">
            <p className="label opacity-55">Run in progress</p>
            <div>
              <h2 className="display-sm">Continue</h2>
              <p className="mt-2 text-sm leading-relaxed">
                {getMode(session.modeId)?.label ?? session.modeId} — puzzle{" "}
                {getPuzzlePosition(session).position} of {getPuzzlePosition(session).total}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
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
            </div>
          </aside>
        )}
      </section>

      <section className="menu-mode-band menu-reveal">
        {modes.map((mode, index) => {
          const best = bests[mode.id];
          return (
            <article key={mode.id} className="menu-mode-card band-pad">
              <p className="label opacity-55">01.0{index + 1}</p>
              <div className="min-h-0">
                <h2 className="display-sm">{mode.label}</h2>
                <p className="mt-3 text-sm leading-relaxed">{mode.description}</p>
              </div>
              <div className="menu-mode-cta">
                <dl>
                  <dt className="label opacity-55">Best</dt>
                  <dd className="mt-1 text-lg">
                    {best ? formatDuration(best.totalTimeMs) : "—"}
                    {best?.rankId && (
                      <span className="ml-2 text-sm opacity-70">{RANKS[best.rankId].name}</span>
                    )}
                  </dd>
                </dl>
                <button
                  type="button"
                  className="btn mt-4"
                  disabled={isStarting}
                  onClick={() => start(mode)}
                >
                  {isStarting ? "Generating…" : "Start run"}
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="menu-settings-band menu-reveal band-pad">
        <p className="label shrink-0 opacity-55">Settings</p>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-8 gap-y-2">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-gold"
                checked={settings.autoCheck}
                onChange={(event) => updateSetting({ autoCheck: event.target.checked })}
              />
              Check path after every placement
            </label>
            <label className="flex items-center gap-3 text-sm">
              <span className="label opacity-55">Name</span>
              <input
                type="text"
                className="border border-navy bg-transparent px-3 py-1"
                value={settings.playerName}
                maxLength={20}
                onChange={(event) => updateSetting({ playerName: event.target.value })}
              />
            </label>
          </div>
      </section>
    </main>
  );
}
