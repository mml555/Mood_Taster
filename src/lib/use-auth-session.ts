"use client";

import { useSyncExternalStore } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthSessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; username: string | null };

type Listener = () => void;

let shared: AuthSessionState = { status: "loading" };
let started = false;
const listeners = new Set<Listener>();

function emit(next: AuthSessionState) {
  shared = next;
  for (const listener of listeners) listener();
}

function startAuthWatch() {
  if (started) return;
  started = true;

  if (!isSupabaseConfigured()) {
    emit({ status: "guest" });
    return;
  }

  const supabase = createClient();

  void (async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        emit({ status: "guest" });
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      emit({ status: "user", username: data?.username ?? null });
    } catch {
      emit({ status: "guest" });
    }
  })();

  supabase.auth.onAuthStateChange((_event, session) => {
    if (!session?.user) {
      emit({ status: "guest" });
      return;
    }
    void supabase
      .from("profiles")
      .select("username")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        emit({ status: "user", username: data?.username ?? null });
      });
  });
}

function subscribe(onStoreChange: Listener): () => void {
  startAuthWatch();
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getSnapshot(): AuthSessionState {
  return shared;
}

const LOADING_SNAPSHOT: AuthSessionState = { status: "loading" };

function getServerSnapshot(): AuthSessionState {
  return LOADING_SNAPSHOT;
}

/**
 * One shared getUser + profile lookup for AuthNav, ProfileNudge, and friends.
 */
export function useAuthSession(): AuthSessionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
