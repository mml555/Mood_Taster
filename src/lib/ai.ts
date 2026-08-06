/**
 * Text generation with a provider chain: Gemini first, Azure OpenAI as backup.
 *
 * Measured on this project, per call, including connection setup:
 *   Gemini 3.1 Flash Lite   1.8s to 2.2s, but one call in three hung outright
 *   Azure gpt-5.6-terra     2.0s to 3.9s, of which ~1.0s is generation
 *
 * Gemini is the faster of the two and free, so it leads. It is also the less
 * reliable of the two, which is why its timeout is aggressive and why Azure
 * sits behind it. A hang should cost us the timeout, not the request.
 *
 * Connection setup (DNS, TCP, TLS) measured 0.7s to 1.3s per cold connection,
 * which is 20% to 35% of total latency. Node's global fetch agent pools
 * connections, so warm instances skip it. Do not introduce custom agents here.
 *
 * Everything fails soft. No key, a timeout, a hang, or a malformed reply
 * returns null and the caller keeps whatever deterministic copy it had.
 */

type AskOptions = {
  instructions: string;
  input: string;
  maxOutputTokens?: number;
  /** Ask for strict JSON where the provider supports enforcing it. */
  json?: boolean;
};

type ProviderResult = { text: string; provider: string } | null;

// --- Gemini -----------------------------------------------------------------

const GEMINI_TIMEOUT_MS = 6000;

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

async function askGemini(opts: AskOptions): Promise<ProviderResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.instructions }] },
          contents: [{ parts: [{ text: opts.input }] }],
          generationConfig: {
            maxOutputTokens: opts.maxOutputTokens ?? 200,
            temperature: 0.7,
            // Guarantees parseable output rather than hoping the prompt held.
            ...(opts.json ? { responseMimeType: "application/json" } : {}),
          },
        }),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      // 429 is the free tier per-minute or per-day ceiling. Expected on demo
      // day, not an incident. Falling through to Azure is the whole point.
      console.warn("[ai] gemini responded %d", res.status);
      return null;
    }

    const body = (await res.json()) as GeminiResponse;
    // Parts can include reasoning signatures carrying no text.
    const text = (body.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text)
      .filter((t): t is string => typeof t === "string")
      .join("")
      .trim();

    return text ? { text, provider: "gemini" } : null;
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.warn("[ai] gemini failed", aborted ? "timeout" : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// --- Azure OpenAI -----------------------------------------------------------

/**
 * Foundry v1 Responses API (/openai/v1/responses), not the classic
 * /openai/deployments/<name>/chat/completions path. So: no api-version, the
 * deployment goes in the body as `model`, and the body uses `input` plus
 * `instructions` rather than `messages`.
 */

const AZURE_TIMEOUT_MS = 8000;

type AzureConfig = {
  endpoint: string;
  apiKey: string;
  deployment: string;
  effort: string;
};

/** All-or-nothing. A partial config means "not configured", not a doomed try. */
function azureConfig(): AzureConfig | null {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  if (!endpoint || !apiKey || !deployment) return null;

  return {
    endpoint: endpoint.endsWith("/") ? endpoint : `${endpoint}/`,
    apiKey,
    deployment,
    effort: process.env.AZURE_OPENAI_REASONING_EFFORT ?? "low",
  };
}

type AzureResponse = {
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
};

/**
 * The REST response has no top-level `output_text`. That is an SDK
 * convenience. Raw callers must walk `output` past any reasoning items to the
 * message, which is why this is not a one-liner.
 */
function readAzureText(body: AzureResponse): string | null {
  for (const item of body.output ?? []) {
    if (item?.type !== "message") continue;
    for (const part of item.content ?? []) {
      if (part?.type === "output_text" && typeof part.text === "string") {
        return part.text;
      }
    }
  }
  return null;
}

async function askAzure(opts: AskOptions): Promise<ProviderResult> {
  const config = azureConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AZURE_TIMEOUT_MS);

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
        // Reasoning is spent before any text is emitted, so this ceiling sits
        // well above the sentence length we actually want back.
        max_output_tokens: opts.maxOutputTokens ?? 400,
        reasoning: { effort: config.effort },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn("[ai] azure responded %d", res.status);
      return null;
    }

    const text = readAzureText((await res.json()) as AzureResponse);
    return text ? { text: text.trim(), provider: "azure" } : null;
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.warn("[ai] azure failed", aborted ? "timeout" : err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// --- Chain ------------------------------------------------------------------

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) || azureConfig() !== null;
}

/**
 * Tries each configured provider in order, returning the first usable text.
 * Null means every provider was unconfigured, slow, or broken.
 */
export async function ask(opts: AskOptions): Promise<string | null> {
  for (const provider of [askGemini, askAzure]) {
    const result = await provider(opts);
    if (result) return result.text;
  }
  return null;
}

// --- Output handling --------------------------------------------------------

/**
 * Model output is untrusted input. It renders as text, so the risk is not
 * script injection but garbage: markdown, wrapping quotes, line breaks, or a
 * paragraph where one sentence belongs.
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
  // line is suspect and we fall back rather than patching it.
  if (text.includes("—")) return null;

  if (text.length > maxLength) return null;

  return text;
}

/** One sanitized sentence, or nothing. */
export async function askForLine(
  opts: AskOptions & { maxLength?: number },
): Promise<string | null> {
  const raw = await ask(opts);
  return raw === null ? null : sanitizeLine(raw, opts.maxLength);
}

/**
 * Pulls a JSON object out of a model reply. Gemini is asked for strict JSON
 * and honours it. Azure is only asked in the prompt and still fences it
 * occasionally, hence the brace match.
 */
export function parseJsonObject(raw: string): Record<string, unknown> | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[0]);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}
