"use client";

import { useRouter } from "next/navigation";
import { getMode } from "@/lib/modes";
import { useGameSessionFlow } from "@/hooks/useGameSessionFlow";
import { PlayShell } from "./PlayShell";

export function PlayScreen({ modeId }: { modeId: string }) {
  const router = useRouter();
  const mode = getMode(modeId);

  if (!mode) {
    return (
      <StatusPanel title="Unknown mode">
        <p className="text-lg opacity-90">No game mode is registered as “{modeId}”.</p>
        <button type="button" className="btn mt-6" onClick={() => router.push("/")}>
          Back to menu
        </button>
      </StatusPanel>
    );
  }

  return <PlayScreenBody modeId={modeId} />;
}

function PlayScreenBody({ modeId }: { modeId: string }) {
  const router = useRouter();
  const mode = getMode(modeId)!;
  const flow = useGameSessionFlow(mode);

  // Generation failures surface as a retryable message, never an uncaught throw (§9.2).
  if (flow.phase === "error") {
    return (
      <StatusPanel title="Puzzle generation failed">
        <p className="text-lg opacity-90">{flow.error}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn" onClick={flow.retry}>
            Try again
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => router.push("/")}>
            Back to menu
          </button>
        </div>
      </StatusPanel>
    );
  }

  if (flow.phase !== "ready") {
    return (
      <StatusPanel title="Building your run">
        <p className="text-lg opacity-90">Generating puzzles…</p>
      </StatusPanel>
    );
  }

  return (
    <>
      <PlayShell mode={mode} flow={flow} />
    </>
  );
}

function StatusPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="frame-page status-page">
      <section className="status-title-band band-pad">
        <p className="label opacity-55">02 / Play</p>
        <h1 className="display uppercase">{title}</h1>
      </section>
      <section className="status-body-band band-pad">{children}</section>
    </main>
  );
}
