import { gsap } from "./gsap";
import { EASE, motionDuration } from "./tokens";

/**
 * Win celebration (§5.4): a light pulse runs the solved chain in order, Start to Target, so the
 * celebration re-states *why* the puzzle was won rather than just cheering.
 *
 * `tileTargets` must already be ordered along the chain.
 */
export function playWinChain(tileTargets: Element[], onComplete?: () => void) {
  const timeline = gsap.timeline({ onComplete });

  if (tileTargets.length === 0) {
    return timeline.to({}, { duration: motionDuration(0.2), onComplete });
  }

  timeline.to(tileTargets, {
    backgroundColor: "#7fd1ff",
    duration: motionDuration(0.16),
    ease: EASE.out,
    stagger: motionDuration(0.07),
  });

  timeline.to(
    tileTargets,
    {
      backgroundColor: "#edebe4",
      duration: motionDuration(0.3),
      ease: EASE.out,
      stagger: motionDuration(0.07),
    },
    motionDuration(0.16),
  );

  return timeline;
}
