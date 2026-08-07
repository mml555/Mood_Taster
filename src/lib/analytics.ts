/**
 * Client analytics spine (BACKLOG P1-6 / PRD §22).
 *
 * Fires to PostHog when NEXT_PUBLIC_POSTHOG_KEY is set; otherwise no-ops.
 * Never send emails, usernames, free-text notes, or other PII in props.
 *
 * North star: Successful Taste Sessions =
 *   feedback_submitted where successful === true (rating "nailed").
 * Build a PostHog insight/funnel on home_viewed → recommendation_shown →
 * feedback_submitted (successful).
 */

export const ANALYTICS_EVENTS = {
  home: "home_viewed",
  intent: "intent_selected",
  question: "question_answered",
  abandon: "quiz_abandoned",
  recommendation: "recommendation_shown",
  alternate: "alternate_shown",
  placesClick: "places_clicked",
  recipeOpen: "recipe_opened",
  feedback: "feedback_submitted",
  signupShown: "signup_shown",
  signupCompleted: "signup_completed",
  dnaUpdate: "dna_updated",
} as const;

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Allowed prop values. Strings should be enums / ids, never free text from users. */
export type AnalyticsPropValue = string | number | boolean;

export type AnalyticsProps = Record<
  string,
  AnalyticsPropValue | null | undefined
>;

const DISTINCT_ID_KEY = "mt:analytics-id";

const PII_KEY =
  /^(email|username|password|name|phone|address|note|text|message|query|display)/i;

/** True when a PostHog project key is configured for the browser. */
export function isAnalyticsEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim());
}

/**
 * Drop null/undefined and keys that look like PII.
 * Pure helper: safe to unit test without a browser.
 */
export function sanitizeProps(
  props?: AnalyticsProps,
): Record<string, AnalyticsPropValue> {
  if (!props) return {};
  const out: Record<string, AnalyticsPropValue> = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined) continue;
    if (PII_KEY.test(key)) continue;
    out[key] = value;
  }
  return out;
}

function readKey(): string | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return key || null;
}

function readHost(): string {
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  return (host || "https://us.i.posthog.com").replace(/\/$/, "");
}

function readDistinctId(): string {
  try {
    const existing = window.localStorage.getItem(DISTINCT_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(DISTINCT_ID_KEY, id);
    return id;
  } catch {
    return `anon-session-${Date.now()}`;
  }
}

/**
 * Fire a product analytics event. Safe on the server and without keys.
 * Failures are swallowed so analytics never break the product flow.
 */
export function track(
  event: AnalyticsEventName,
  props?: AnalyticsProps,
): void {
  if (typeof window === "undefined") return;
  const apiKey = readKey();
  if (!apiKey) return;

  const body = {
    api_key: apiKey,
    event,
    properties: {
      distinct_id: readDistinctId(),
      ...sanitizeProps(props),
      $lib: "mood-taster",
      $lib_version: "1",
    },
    timestamp: new Date().toISOString(),
  };

  try {
    void fetch(`${readHost()}/i/v0/e/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
      mode: "cors",
      credentials: "omit",
    }).catch(() => {
      /* analytics must never surface */
    });
  } catch {
    /* ignore */
  }
}
