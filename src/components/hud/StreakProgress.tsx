"use client";

import { cn } from "@/lib/utils/cn";

export interface StreakProgressProps {
  position: number;
  total: number;
}

export function StreakProgress({ position, total }: StreakProgressProps) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col justify-between py-0.5">
      <span className="label opacity-55">Streak</span>
      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap text-xl leading-none">
          {position} / {total}
        </span>
        <div className="flex gap-1" role="img" aria-label={`Puzzle ${position} of ${total}`}>
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-2.5 w-2.5 border border-cream",
                index < position - 1 && "bg-cream",
                index === position - 1 && "bg-gold",
                index > position - 1 && "bg-transparent",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
