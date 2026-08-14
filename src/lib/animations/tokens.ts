/**
 * Shared motion vocabulary (§5.4). Every tween in the game pulls its timing and easing from
 * here so motion stays consistent instead of being re-invented per component.
 *
 * No bounce/elastic eases anywhere — overshoot reads as "soft" and fights the sharp-edge
 * visual language.
 */
export const DURATION = {
  rotate: 0.14,
  pickup: 0.15,
  drop: 0.18,
  pulse: 0.4,
  reveal: 0.5,
  transition: 0.35,
} as const;

export const EASE = {
  /** Default: decisive arrival, no overshoot. */
  out: "power2.out",
  /** Symmetric, for reversible state like rotation. */
  inOut: "power1.inOut",
  in: "power2.in",
  linear: "none",
} as const;

export const COLOR = {
  shockingBlue: "#0a5cff",
  electricPulse: "#7fd1ff",
  brokenWhite: "#edebe4",
  brokenBlack: "#121214",
  errorRed: "#ff4d4d",
} as const;

export const Z_INDEX = {
  /** A dragged tile sits above the grid, tray, and HUD (§2.2). */
  dragging: 60,
  board: 10,
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Collapses any duration to ~0 for reduced-motion users while keeping end states intact. */
export function motionDuration(seconds: number): number {
  return prefersReducedMotion() ? 0.001 : seconds;
}
