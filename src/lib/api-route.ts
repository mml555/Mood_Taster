import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { reportServerError } from "./server-errors";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

/**
 * Shared plumbing for the account-backed API routes.
 *
 * Every one of them repeats the same four steps: refuse when Supabase is not
 * configured, build a server client, refuse when there is no session, and turn
 * anything thrown along the way into a generic 500. That boilerplate outweighed
 * the actual query in most of these files, so it lives here once.
 *
 * Database errors are logged, never returned. The raw Postgres message names
 * schemas, functions, and constraints, which is free reconnaissance for an
 * anonymous caller and tells the user nothing they can act on.
 */

export type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type RouteContext = {
  request: Request;
  supabase: ServerClient;
  user: User;
};

const NOT_CONFIGURED = "Accounts are not configured";
const UNAUTHORIZED = "Unauthorized";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * A response a handler wants to give up with. Thrown rather than returned so
 * helpers nested inside a handler can end the request without every call site
 * threading a union type back up.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "HttpError";
  }
}

/** Request body as JSON, or a 400. Never a 500 for a malformed body. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

/**
 * Log a Postgres error with route context and give up with the caller's
 * user-facing message. No-op when there is no error, so call sites read as a
 * single line after each query.
 */
export function failOnDbError(
  error: { message: string } | null | undefined,
  scope: string,
  action: string,
  publicMessage: string,
): void {
  if (!error) return;
  reportServerError(scope, new Error(`${action} failed: ${error.message}`), {
    action,
    kind: "database",
  });
  throw new HttpError(500, publicMessage);
}

/**
 * Wraps a handler with the HttpError mapping and a logged catch-all, without
 * requiring a session. For the public routes, which still want a thrown 400
 * from readJson to come back as a 400 rather than an unlogged 500.
 */
export function withRoute(
  scope: string,
  failMessage: string,
  handler: (request: Request) => Promise<NextResponse>,
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    try {
      return await handler(request);
    } catch (err) {
      if (err instanceof HttpError) {
        return jsonError(err.publicMessage, err.status);
      }
      reportServerError(scope, err, { kind: "unhandled" });
      return jsonError(failMessage, 500);
    }
  };
}

/**
 * Wraps a handler that needs a signed-in user. The handler only ever runs with
 * a real session, so it can get straight to its query.
 *
 * `scope` and `failMessage` are only used for the catch-all: unexpected throws
 * are logged under `[scope]` and answered with `failMessage`.
 */
export function withUser(
  scope: string,
  failMessage: string,
  handler: (ctx: RouteContext) => Promise<NextResponse>,
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    if (!isSupabaseConfigured()) {
      return jsonError(NOT_CONFIGURED, 503);
    }

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return jsonError(UNAUTHORIZED, 401);
      }

      return await handler({ request, supabase, user });
    } catch (err) {
      if (err instanceof HttpError) {
        return jsonError(err.publicMessage, err.status);
      }
      reportServerError(scope, err, { kind: "unhandled" });
      return jsonError(failMessage, 500);
    }
  };
}
