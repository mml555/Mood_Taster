import {
  createNeutralDna,
  readDna,
  writeDna,
} from "@/lib/dna";
import type { DnaProfile } from "@/lib/taste-types";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { parseDnaProfile } from "@/lib/auth-schema";

/** Write DNA locally and, when signed in, mirror to Supabase. */
export async function persistDna(dna: DnaProfile): Promise<void> {
  writeDna(dna);
  if (!isSupabaseConfigured()) return;

  try {
    await fetch("/api/dna", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: dna }),
    });
  } catch {
    // Local write already succeeded; cloud sync is best-effort.
  }
}

export async function resetDnaEverywhere(): Promise<void> {
  const empty = createNeutralDna();
  writeDna(empty);
  if (!isSupabaseConfigured()) return;

  try {
    await fetch("/api/dna", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: empty }),
    });
  } catch {
    /* best-effort */
  }
}

/**
 * Load DNA for the current user: prefer cloud when signed in,
 * seed cloud from local on first login, always keep local in sync.
 */
export async function loadDnaForUser(): Promise<DnaProfile> {
  const local = readDna();
  if (!isSupabaseConfigured()) return local;

  try {
    const res = await fetch("/api/dna", { method: "GET" });
    if (res.status === 401 || res.status === 503) return local;
    if (!res.ok) return local;

    const body = (await res.json()) as { profile?: unknown; empty?: boolean };
    if (body.empty) {
      const hasEvidence = Object.values(local).some((e) => e.samples > 0);
      if (hasEvidence) {
        await persistDna(local);
      }
      return local;
    }

    const remote = parseDnaProfile(body.profile);
    if (!remote) return local;
    writeDna(remote);
    return remote;
  } catch {
    return local;
  }
}
