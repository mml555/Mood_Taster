import { request as httpsRequest } from "node:https";

/**
 * Minimal HTTPS text fetch for the Google APIs.
 *
 * node:https rather than fetch, so the request goes out with exactly the
 * headers set by the caller and nothing added or normalised on the way. The
 * Places key carries an HTTP referrer restriction, and the `Referer` header is
 * what satisfies it, so it has to survive verbatim. Do not swap this for fetch.
 *
 * Resolves with the status and raw body for any completed response, including
 * error statuses. Rejects only when the connection fails or times out, so
 * callers can tell "Google said no" from "we never got there".
 */

const DEFAULT_TIMEOUT_MS = 4000;

export type TextResponse = {
  status: number;
  body: string;
};

export function requestText(
  url: string,
  opts: {
    method: "GET" | "POST";
    headers?: Record<string, string>;
    /** Serialized request body. Content-Length is set from it. */
    body?: string;
    timeoutMs?: number;
  },
): Promise<TextResponse> {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const headers: Record<string, string | number> = { ...opts.headers };
    if (opts.body !== undefined) {
      headers["Content-Length"] = Buffer.byteLength(opts.body);
    }

    const req = httpsRequest(
      {
        hostname: target.hostname,
        path: target.pathname + target.search,
        method: opts.method,
        headers,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => {
          body += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );

    req.setTimeout(opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, () => {
      req.destroy(new Error("timeout"));
    });
    req.on("error", reject);
    if (opts.body !== undefined) req.write(opts.body);
    req.end();
  });
}

/** Same contract as requestText, with the body parsed. Null on unusable JSON. */
export async function requestJson<T>(
  url: string,
  opts: Parameters<typeof requestText>[1],
): Promise<{ status: number; data: T | null }> {
  const { status, body } = await requestText(url, opts);
  try {
    return { status, data: JSON.parse(body) as T };
  } catch {
    return { status, data: null };
  }
}
