"use client";

import { useEffect, useRef } from "react";
import {
  track,
  type AnalyticsEventName,
  type AnalyticsProps,
} from "@/lib/analytics";

/**
 * Fires a single analytics event on mount. Use on server-rendered pages
 * that need a page-view style beacon without converting the whole tree.
 */
export function AnalyticsBeacon({
  event,
  props,
}: {
  event: AnalyticsEventName;
  props?: AnalyticsProps;
}) {
  // Props are usually a fresh object literal, so they cannot be an effect
  // dependency without refiring the beacon on every render. Held in a ref that
  // is updated in its own effect, declared first so it has already run by the
  // time the beacon below reads it.
  const propsRef = useRef(props);

  useEffect(() => {
    propsRef.current = props;
  });

  useEffect(() => {
    track(event, propsRef.current);
  }, [event]);

  return null;
}
