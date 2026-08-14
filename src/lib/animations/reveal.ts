import { gsap } from "./gsap";
import { DURATION, EASE, motionDuration } from "./tokens";

type Target = gsap.TweenTarget;

/**
 * Rank reveal (§5.4): a hard clip-path wipe rather than a fade, so the Bokor rank name arrives
 * with the same edge quality as the rest of the UI.
 */
export function revealRankName(target: Target) {
  return gsap.fromTo(
    target,
    { clipPath: "inset(0 100% 0 0)", x: -12 },
    {
      clipPath: "inset(0 0% 0 0)",
      x: 0,
      duration: motionDuration(DURATION.reveal),
      ease: EASE.out,
    },
  );
}

/**
 * Directional entrance between menu → play → results. A clip-path wipe rather than a fade,
 * per §5.4's "avoid soft crossfades as the primary transition" — the content arrives with a
 * hard edge, matching the rest of the visual language.
 */
export function playScreenEnter(targets: Target, options: { stagger?: number } = {}) {
  return gsap.fromTo(
    targets,
    { clipPath: "inset(0 0 100% 0)", y: 14 },
    {
      clipPath: "inset(0 0 0% 0)",
      y: 0,
      duration: motionDuration(DURATION.transition),
      ease: EASE.out,
      stagger: motionDuration(options.stagger ?? 0.06),
      clearProps: "clipPath",
    },
  );
}

/** Staggered rows for split times / leaderboard entries. */
export function revealRows(targets: Target) {
  return gsap.fromTo(
    targets,
    { autoAlpha: 0, x: -10 },
    {
      autoAlpha: 1,
      x: 0,
      duration: motionDuration(0.25),
      ease: EASE.out,
      stagger: motionDuration(0.05),
    },
  );
}
