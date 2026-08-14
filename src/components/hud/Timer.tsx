"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/animations";
import { formatDuration } from "@/lib/scoring";

export interface TimerProps {
  label: string;
  getMs: () => number;
  emphasis?: boolean;
}

/**
 * Driven off GSAP's ticker and written straight to the DOM (§5.4) — a live timer must not
 * re-render React 60 times a second while the player is mid-drag.
 */
export function Timer({ label, getMs, emphasis }: TimerProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const lastTextRef = useRef("");

  useGSAP(() => {
    const tick = () => {
      const element = valueRef.current;
      if (!element) return;
      const text = formatDuration(getMs());
      if (text === lastTextRef.current) return;
      lastTextRef.current = text;
      element.textContent = text;
    };

    gsap.ticker.add(tick);
    return () => gsap.ticker.remove(tick);
  }, {});

  return (
    <div className="flex flex-col gap-1">
      <span className="label opacity-70">{label}</span>
      <span
        ref={valueRef}
        className={emphasis ? "font-display text-3xl leading-none" : "text-xl leading-none"}
      >
        00:00.00
      </span>
    </div>
  );
}
