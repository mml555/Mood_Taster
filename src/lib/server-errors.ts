import { after } from "next/server";

/**
 * Server-side exception reporting (production readiness gap: nothing aggregated
 * server errors, so a failing route was invisible until someone read Vercel's
 * runtime logs by hand).
 *
 * Ships `$exception` events to PostHog error tracking over the same ingest
 * endpoint the client analytics spine uses, deliberately without the SDK. The
 * product already talks to PostHog with a plain fetch, and a second transport
 * would mean a new dependency, a second CSP origin to reason about, and a
 * cold-start cost on every route for one POST.
 *
 * Three rules hold everywhere in this file:
 *   1. Never throw. A reporting failure must not turn a handled 500 into a
 *      crash, so every path is wrapped and swallowed.
 *   2. Never block the response. Delivery is scheduled with `after()` so the
 *      user waits on the route, not on analytics.
 *   3. Never stop logging. console.error still runs whether or not a key is
 *      configured, so Vercel's log stream stays the source of truth.
 */

/** Same allowed prop shape as the client spine. Ids and enums, never free text. */
export type ErrorContext = Record<string, string | number | boolean | null>;

/** Stacks are for grouping and a first look, not a full archive. */
const MAX_STACK_CHARS = 4000;

/** Messages can quote user input, so they are capped before leaving the box. */
const MAX_MESSAGE_CHARS = 500;

/**
 * A shared identity for every server exception. Deliberately not the signed-in
 * user's id: error tracking does not need to name a person to be actionable,
 * and attaching one would put account identifiers in a system whose whole job
 * is to be widely readable.
 */
const SERVER_DISTINCT_ID = "server";

function readKey(): string | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return key || null;
}

function readHost(): string {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  return (host || "https://us.i.posthog.com").replace(/\/$/, "");
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

/**
 * Anything thrown, reduced to a type and a message. Non-Error throws are common
 * enough (a rejected fetch, a string, an object from a driver) that treating
 * them as unreportable would lose the failures most worth seeing.
 */
function describe(err: unknown): {
  type: string;
  value: string;
  stack: string | null;
} {
  if (err instanceof Error) {
    return {
      type: err.name || "Error",
      value: truncate(err.message || "Unknown error", MAX_MESSAGE_CHARS),
      stack: err.stack ? truncate(err.stack, MAX_STACK_CHARS) : null,
    };
  }

  if (typeof err === "string") {
    return {
      type: "NonErrorThrow",
      value: truncate(err, MAX_MESSAGE_CHARS),
      stack: null,
    };
  }

  let serialized: string;
  try {
    serialized = JSON.stringify(err) ?? String(err);
  } catch {
    serialized = String(err);
  }

  return {
    type: "NonErrorThrow",
    value: truncate(serialized, MAX_MESSAGE_CHARS),
    stack: null,
  };
}

/**
 * The event body PostHog error tracking expects. `$exception_list` is what
 * drives issue grouping, so type and value go there rather than into loose
 * properties. The stack rides along as a plain string: sending a `stacktrace`
 * object means committing to PostHog's frame schema, and a malformed one
 * symbolicates worse than none at all.
 *
 * Exported for tests, which is the only way to assert the payload shape
 * without a live ingest endpoint.
 */
export function buildExceptionPayload(
  apiKey: string,
  scope: string,
  err: unknown,
  context?: ErrorContext,
  timestamp = new Date().toISOString(),
): Record<string, unknown> {
  const { type, value, stack } = describe(err);

  const props: Record<string, unknown> = {
    distinct_id: SERVER_DISTINCT_ID,
    $exception_list: [
      { type, value, mechanism: { handled: true, synthetic: false } },
    ],
    $exception_type: type,
    $exception_message: value,
    scope,
    $lib: "mood-taster-server",
    $lib_version: "1",
  };

  if (stack) props.$exception_stack_raw = stack;

  if (context) {
    for (const [key, contextValue] of Object.entries(context)) {
      if (contextValue === null) continue;
      // Namespaced so a context key can never shadow $exception_list or
      // distinct_id and quietly corrupt the event.
      props[`ctx_${key}`] = contextValue;
    }
  }

  return {
    api_key: apiKey,
    event: "$exception",
    properties: props,
    timestamp,
  };
}

/** Fire and forget, with a timeout so a slow ingest cannot pin a worker open. */
async function deliver(payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${readHost()}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
  } catch {
    // A reporting failure is not worth a second report.
  }
}

/**
 * Log a server-side failure and, when analytics is configured, ship it to
 * PostHog error tracking.
 *
 * `scope` is the same short tag already used in this codebase's log prefixes
 * ("auth", "match", "places"), so a log line and its PostHog issue share a
 * vocabulary.
 */
export function reportServerError(
  scope: string,
  err: unknown,
  context?: ErrorContext,
): void {
  // Unconditional, and first: if everything below fails, the log still exists.
  console.error(`[${scope}]`, err);

  const apiKey = readKey();
  if (!apiKey) return;

  try {
    const payload = buildExceptionPayload(apiKey, scope, err, context);

    // `after()` runs the send once the response has been flushed. It throws
    // outside a request scope (a script, a module-load path), so the fallback
    // is an un-awaited send rather than losing the report.
    try {
      after(() => deliver(payload));
    } catch {
      void deliver(payload);
    }
  } catch {
    // Reporting is best effort by construction. The console.error above stands.
  }
}
