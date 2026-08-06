import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./config";
import type { Database } from "./database.types";

/** Service-role client for trusted server paths only. Never import in client code. */
export function createServiceClient() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error("Supabase service role is not configured");
  }
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
