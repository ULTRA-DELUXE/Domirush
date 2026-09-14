"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MobileGateScreen } from "./MobileGate";
import { ViewportGateScreen } from "./ViewportGate";
import { useIsPhoneViewport, useViewportTooSmall } from "./viewport";

/**
 * Measures the viewport before mounting game screens so a phone never loads PlayShell or
 * store subscriptions. Pending is an empty navy field — never the game.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const isPhone = useIsPhoneViewport();
  const tooSmall = useViewportTooSmall();

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <div id="app-root" className="bg-navy" aria-hidden="true" />;
  }

  return (
    <div id="app-root">
      {isPhone ? <MobileGateScreen /> : tooSmall ? <ViewportGateScreen /> : children}
    </div>
  );
}
