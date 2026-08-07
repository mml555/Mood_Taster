"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export type AuthSessionState =
  | { status: "loading" }
  | { status: "guest" }
  | { status: "user"; user: User; username: string | null };

type AuthSessionContextValue = AuthSessionState;

const AuthSessionContext = createContext<AuthSessionContextValue>({
  status: "loading",
});

async function loadUsername(
  userId: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();
  return data?.username ?? null;
}

/**
 * One browser getUser (+ profile username) per page tree. AuthNav and
 * ProfileNudge read this instead of each firing their own auth round trip.
 */
export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthSessionState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    queueMicrotask(() => {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setState({ status: "guest" });
        return;
      }

      const supabase = createClient();

      void (async () => {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (cancelled) return;

          if (!user) {
            setState({ status: "guest" });
            return;
          }

          const username = await loadUsername(user.id);
          if (!cancelled) {
            setState({ status: "user", user, username });
          }
        } catch {
          if (!cancelled) setState({ status: "guest" });
        }
      })();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          setState({ status: "guest" });
          return;
        }
        void loadUsername(session.user.id).then((username) => {
          if (!cancelled) {
            setState({
              status: "user",
              user: session.user,
              username,
            });
          }
        });
      });

      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  return useContext(AuthSessionContext);
}
