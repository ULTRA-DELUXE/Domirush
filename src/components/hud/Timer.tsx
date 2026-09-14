"use client";

import { useEffect, useRef } from "react";
import { formatDuration } from "@/lib/scoring";

export interface TimerProps {
  label: string;
  /** Pull elapsed ms from session timestamps — never store elapsed in React state. */
  getMs: () => number;
  isRunning: boolean;
  emphasis?: boolean;
}

/**
 * Ref + rAF side channel. textContent updates never re-render the HUD card, so digit
 * changes cannot resize the layout.
 */
export function Timer({ label, getMs, isRunning, emphasis }: TimerProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef<number | undefined>(undefined);
  const getMsRef = useRef(getMs);
  getMsRef.current = getMs;

  useEffect(() => {
    const write = () => {
      if (valueRef.current) valueRef.current.textContent = formatDuration(getMsRef.current());
    };

    write();
    if (!isRunning) return;

    const tick = () => {
      write();
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning]);

  return (
    <div className="timer-card">
      <span className="label opacity-55">{label}</span>
      <span
        ref={valueRef}
        className={
          emphasis
            ? "timer-readout font-display text-[clamp(1.25rem,2vw,1.85rem)] leading-none"
            : "timer-readout text-[clamp(1rem,1.6vw,1.35rem)] leading-none"
        }
      >
        00:00.00
      </span>
    </div>
  );
}
