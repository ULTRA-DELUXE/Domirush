import { gsap } from "./gsap";
import { COLOR, DURATION, EASE, Z_INDEX, motionDuration } from "./tokens";

type Target = gsap.TweenTarget;

/** Communicates "this tile is in your hand": lifted off the table and above everything else. */
export function animateTilePickup(target: Target) {
  gsap.set(target, { zIndex: Z_INDEX.dragging });
  return gsap.to(target, {
    scale: 1.08,
    boxShadow: `0 18px 0 -6px ${COLOR.navyShadow}`,
    duration: motionDuration(DURATION.pickup),
    ease: EASE.out,
    overwrite: "auto",
  });
}

/**
 * Settles a tile back to grid level. Sharp arrival — no bounce. Clears the drag offset too,
 * since the tile's committed cell is expressed by layout, not by the transform.
 */
export function animateTileDrop(target: Target) {
  return gsap.to(target, {
    x: 0,
    y: 0,
    scale: 1,
    boxShadow: "0 0 0 0 rgba(28, 66, 134, 0)",
    duration: motionDuration(DURATION.drop),
    ease: EASE.out,
    overwrite: "auto",
    onComplete: () => gsap.set(target, { clearProps: "zIndex,boxShadow" }),
  });
}

/** Returns a tile to its origin when a drop is rejected or lands off-grid. */
export function animateTileReturn(target: Target, onComplete?: () => void) {
  return gsap.to(target, {
    x: 0,
    y: 0,
    scale: 1,
    boxShadow: "0 0 0 0 rgba(28, 66, 134, 0)",
    duration: motionDuration(DURATION.drop),
    ease: EASE.out,
    overwrite: "auto",
    onComplete: () => {
      gsap.set(target, { clearProps: "zIndex,boxShadow" });
      onComplete?.();
    },
  });
}

/**
 * Snappy absolute rotation so repeated R presses feel responsive rather than queued.
 * Uses `_cw` so the tile always turns clockwise, including across the 270°→0° wrap (§2.2).
 */
export function animateTileRotation(target: Target, rotation: number) {
  return gsap.to(target, {
    rotation: `${rotation}_cw`,
    duration: motionDuration(DURATION.rotate),
    ease: EASE.inOut,
    overwrite: "auto",
  });
}

/** Rejected placement: a short lateral shudder, not a colour change, so it reads instantly. */
export function animateTileReject(target: Target) {
  return gsap
    .timeline()
    .to(target, { x: "-=6", duration: motionDuration(0.05), ease: EASE.linear })
    .to(target, { x: "+=12", duration: motionDuration(0.07), ease: EASE.linear })
    .to(target, { x: "-=6", duration: motionDuration(0.05), ease: EASE.linear });
}
