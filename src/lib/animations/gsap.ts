import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

// Client-side module evaluation happens before any effect runs, so registering here is enough
// while staying inert during SSR.
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, Draggable);
}

export { Draggable, gsap, useGSAP };
