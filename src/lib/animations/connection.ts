import { gsap } from "./gsap";
import { DURATION, EASE, motionDuration } from "./tokens";

type Target = gsap.TweenTarget;

/**
 * Functional feedback, not flair (§5.4): an electric-blue pulse travels outward from a junction
 * the instant two halves match, so the player never has to hunt for confirmation.
 */
export function animateConnectionPulse(target: Target) {
  return gsap.fromTo(
    target,
    { scale: 0.4, autoAlpha: 0.9 },
    {
      scale: 2.2,
      autoAlpha: 0,
      duration: motionDuration(DURATION.pulse),
      ease: EASE.out,
      overwrite: "auto",
    },
  );
}

/** Mismatched-but-touching halves: flagged, never blocked (§2.4). */
export function animateMismatchFlash(target: Target) {
  return gsap.fromTo(
    target,
    { autoAlpha: 0.85 },
    {
      autoAlpha: 0,
      duration: motionDuration(0.5),
      ease: EASE.out,
      overwrite: "auto",
    },
  );
}

/**
 * Traces the current partial chain from Start so "Check Path" shows how far the player got.
 * A pulse that runs tile-by-tile in chain order, on transforms only, so it reads as travel
 * along the path rather than a static highlight.
 */
export function animateChainTrace(targets: Target) {
  return gsap.fromTo(
    targets,
    { scale: 1 },
    {
      scale: 1.06,
      duration: motionDuration(0.12),
      ease: EASE.out,
      stagger: motionDuration(0.06),
      repeat: 1,
      yoyo: true,
      overwrite: "auto",
    },
  );
}
