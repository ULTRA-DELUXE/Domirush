"use client";

import { useEffect, useState } from "react";

/** Below this width is a phone. iPad portrait (768) stays in-game. */
export const PHONE_MAX_WIDTH = 767;

/** Short windows cannot fit the 8×8 board; width floors are handled by the phone gate. */
export const MIN_PLAYABLE_HEIGHT = 640;

export function useIsPhoneViewport() {
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${PHONE_MAX_WIDTH}px)`);
    const update = () => setIsPhone(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isPhone;
}

export function useViewportTooSmall() {
  const [tooSmall, setTooSmall] = useState(false);

  useEffect(() => {
    const check = () => setTooSmall(window.innerHeight < MIN_PLAYABLE_HEIGHT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return tooSmall;
}
