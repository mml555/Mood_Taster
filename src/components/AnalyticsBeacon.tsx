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
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    track(event, propsRef.current);
  }, [event]);

  return null;
}
