"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import {
  track,
  type AnalyticsEventName,
  type AnalyticsProps,
} from "@/lib/analytics";

type TrackedLinkProps = ComponentProps<typeof Link> & {
  event: AnalyticsEventName;
  eventProps?: AnalyticsProps;
};

/** Link that fires a typed analytics event on click (before navigation). */
export function TrackedLink({
  event,
  eventProps,
  onClick,
  ...rest
}: TrackedLinkProps) {
  return (
    <Link
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        track(event, eventProps);
        onClick?.(e);
      }}
    />
  );
}
