"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DietaryPrefsEditor } from "@/components/DietaryPrefsEditor";
import { clearLocalUserData } from "@/lib/local-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

type ProfileState = {
  email: string | null;
  username: string | null;
};

export function AccountPanel() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm">("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      if (!isSupabaseConfigured()) {
        setError("Accounts are not configured.");
        return;
      }

      void (async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/login");
          return;
        }

        const { data } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        setProfile({
          email: user.email ?? null,
          username: data?.username ?? null,
        });
      })();
    });
  }, [router]);

  const onSignOut = useCallback(async () => {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // After the session is gone, so a failed sign-out never wipes live data.
    clearLocalUserData();
    router.push("/");
    router.refresh();
  }, [router]);

  const onDeleteAccount = useCallback(async () => {
    setPending(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setDeleteError(body.error ?? "Could not delete your account");
        setPending(false);
        return;
      }

      clearLocalUserData();
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setDeleteError("Could not delete your account");
      setPending(false);
    }
  }, [router]);

  if (error) {
    return (
      <p className="auth-error" role="alert">
        {error}
      </p>
    );
  }

  if (!profile) {
    return <p className="dna-lede">Loading profile…</p>;
  }

  return (
    <div className="account-panel">
      <dl className="account-facts">
        <div>
          <dt>Username</dt>
          <dd>{profile.username ?? "—"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{profile.email ?? "—"}</dd>
        </div>
      </dl>

      <section className="account-dietary" aria-labelledby="diet-title">
        <h2 id="diet-title" className="dietary-section-title">
          Diet and allergies
        </h2>
        <DietaryPrefsEditor />
      </section>

      <div className="result-actions">
        <Link className="cta" href="/dna">
          Taste DNA
        </Link>
        <Link className="text-link" href="/taste">
          Start a quiz
        </Link>
        <button
          type="button"
          className="reject-btn"
          onClick={onSignOut}
          disabled={pending}
        >
          Sign out
        </button>
      </div>

      <section className="account-delete" aria-labelledby="delete-title">
        <h2 id="delete-title" className="dietary-section-title">
          Delete account
        </h2>
        <p className="dietary-note">
          Removes cloud Taste DNA, favorites, history, diet settings, and this
          login. Also clears taste data saved on this device.
        </p>

        {deleteStep === "idle" ? (
          <button
            type="button"
            className="reject-btn"
            onClick={() => setDeleteStep("confirm")}
            disabled={pending}
          >
            Delete account
          </button>
        ) : (
          <div className="account-delete-confirm">
            <p className="dietary-note">
              Really delete? Cloud data is gone for good.
            </p>
            <div className="account-delete-actions">
              <button
                type="button"
                className="cta"
                onClick={onDeleteAccount}
                disabled={pending}
              >
                Yes, delete everything
              </button>
              <button
                type="button"
                className="reject-btn"
                onClick={() => {
                  setDeleteStep("idle");
                  setDeleteError(null);
                }}
                disabled={pending}
              >
                Keep account
              </button>
            </div>
          </div>
        )}

        {deleteError ? (
          <p className="auth-error" role="alert">
            {deleteError}
          </p>
        ) : null}
      </section>
    </div>
  );
}
