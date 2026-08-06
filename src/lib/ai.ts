/**
 * Azure OpenAI, Foundry v1 Responses API.
 *
 * This is the v1 GA surface (/openai/v1/responses), not the classic
 * /openai/deployments/<name>/chat/completions path. Consequences:
 *   - no api-version parameter
 *   - the deployment name goes in the body as `model`
 *   - the body uses `input` + `instructions`, not `messages`
 *
 * The deployed model is a reasoning model. It spends max_output_tokens on
 * internal reasoning before emitting any text, so budgets here are generous
 * relative to the sentence length we actually want back.
 *
 * Every function fails soft. A missing key, a timeout, or a malformed reply
 * returns null and the caller keeps whatever deterministic copy it already had.
 */

type AzureConfig = {
  endpoint: string;
  apiKey: string;
  deployment: string;
  effort: string;
};

/**
 * All-or-nothing. A partial configuration means "not configured" rather than
 * an attempt that is guaranteed to fail.
 */
function readConfig(): AzureConfig | null {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (!endpoint || !apiKey || !deployment) return null;

  return {
    // Tolerate a missing trailing slash rather than silently building a 404.
    endpoint: endpoint.endsWith("/") ? endpoint : `${endpoint}/`,
    apiKey,
    deployment,
    effort: process.env.AZURE_OPENAI_REASONING_EFFORT ?? "low",
  };
}

export function isAiConfigured(): boolean {
  return readConfig() !== null;
}

type ResponsesOutput = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

/**
 * The REST response has no top-level `output_text`. That field is an SDK
 * convenience. Raw callers must walk `output` for the message item, skipping
 * reasoning items, which is why this is not a one-liner.
 */
function readText(body: ResponsesOutput): string | null {
  const items = body.output;
  if (!Array.isArray(items)) return null;

  for (const item of items) {
    if (item?.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        return part.text;
      }
    }
  }
  return null;
}

/**
 * Model output is untrusted input. It is rendered as text, so the risk is not
 * script injection but garbage: markdown, quotes, line breaks, or a paragraph
 * where a sentence belongs.
 */
export function sanitizeLine(raw: string, maxLength = 180): string | null {
  let text = raw
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Models like to wrap a single sentence in quotes.
  text = text.replace(/^["'“‘]+|["'”’]+$/g, "").trim();

  if (!text) return null;

  // Repo-wide ban. A violation means the instruction was ignored, so the whole
  // line is suspect and we fall back rather than rewriting it.
  if (text.includes("—")) return null;

  if (text.length > maxLength) return null;

  return text;
}

type AskOptions = {
  instructions: string;
  input: string;
  maxOutputTokens?: number;
  timeoutMs?: number;
};

/**
 * Returns the raw model text, or null on any failure. Never throws.
 */
export async function ask(opts: AskOptions): Promise<string | null> {
  const config = readConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 2500);

  try {
    const res = await fetch(`${config.endpoint}responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey,
      },
      body: JSON.stringify({
        model: config.deployment,
        instructions: opts.instructions,
        input: opts.input,
        max_output_tokens: opts.maxOutputTokens ?? 400,
        reasoning: { effort: config.effort },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("[ai] azure responded %d", res.status);
      return null;
    }

    return readText((await res.json()) as ResponsesOutput);
  } catch (err) {
    // Aborts are expected under load and are not worth an error-level log.
    const aborted = err instanceof Error && err.name === "AbortError";
    console.warn("[ai] request failed", aborted ? "timeout" : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convenience wrapper for the common case: one sanitized sentence or nothing.
 */
export async function askForLine(
  opts: AskOptions & { maxLength?: number },
): Promise<string | null> {
  const raw = await ask(opts);
  if (raw === null) return null;
  return sanitizeLine(raw, opts.maxLength);
}
