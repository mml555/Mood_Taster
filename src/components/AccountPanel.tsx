"use client";

import Link from "next/link";
import {
  Bell,
  ChevronRight,
  Leaf,
  LogOut,
  MapPin,
  Sun,
  Donut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { DietaryPrefsEditor } from "@/components/DietaryPrefsEditor";
import {
  DNA_DIMENSIONS,
  labelDimension,
  strongestDimensions,
} from "@/lib/dna";
import { loadDnaForUser } from "@/lib/dna-sync";
import { clearLocalUserData } from "@/lib/local-data";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuthSession } from "@/lib/use-auth-session";
import type { DnaDimension, DnaProfile } from "@/lib/taste-types";
import { ICON_MD, ICON_STROKE } from "@/lib/ui-icons";

const RADAR_DIMS: DnaDimension[] = [
  "savory",
  "sweet",
  "spicy",
  "fresh",
  "crunchy",
  "creamy",
];

type ProfileState = {
  email: string | null;
  username: string | null;
};

export function AccountPanel() {
  const router = useRouter();
  const auth = useAuthSession();
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [dna, setDna] = useState<DnaProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deleteStep, setDeleteStep] = useState<"idle" | "confirm">("idle");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDiet, setShowDiet] = useState(false);

  useEffect(() => {
    queueMicrotask(async () => {
      setDna(await loadDnaForUser());
    });
  }, []);

  useEffect(() => {
    if (auth.status !== "user") {
      return;
    }
    if (!isSupabaseConfigured()) {
      queueMicrotask(() => setError("Accounts are not configured."));
      return;
    }

    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      setProfile({
        email: user.email ?? null,
        username: data?.username ?? auth.username,
      });
    })();
  }, [auth]);

  const displayProfile =
    auth.status === "user"
      ? profile ?? { email: null, username: auth.username }
      : null;

  const radarData = useMemo(() => {
    if (!dna) return [];
    return RADAR_DIMS.map((dimension) => {
      const entry = dna.experience[dimension].samples
        ? dna.experience[dimension]
        : dna.prefs[dimension];
      return {
        subject: labelDimension(dimension),
        value: Math.round(entry.score * 100),
      };
    });
  }, [dna]);

  const dnaLabel = useMemo(() => {
    if (!dna) return "Still learning";
    const top = strongestDimensions(dna, DNA_DIMENSIONS, 1, "effective")[0];
    return top
      ? `${labelDimension(top.dimension)} Seeker`
      : "Still learning";
  }, [dna]);

  const onSignOut = useCallback(async () => {
    setPending(true);
    const supabase = createClient();
    await supabase.auth.signOut();
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

  if (auth.status === "loading") {
    return <p className="dna-lede">Loading profile…</p>;
  }

  if (auth.status === "guest") {
    return (
      <section className="profile-panel">
        <span className="profile-decor" style={{ top: "1rem", right: "-1.5rem" }} aria-hidden>
          <Sun size={100} />
        </span>
        <div className="profile-guest-card">
          <h1>Ready to find your flavor?</h1>
          <div className="profile-guest-actions">
            {isSupabaseConfigured() ? (
              <Link className="cta" href="/login" style={{ width: "100%" }}>
                Sign in
              </Link>
            ) : null}
            <Link className="cta-secondary" href="/taste" style={{ width: "100%" }}>
              Play as Guest
            </Link>
          </div>
        </div>

        {dna ? (
          <div className="profile-radar-wrap">
            <h2>Taste DNA</h2>
            <div className="profile-radar-card">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="color-mix(in srgb, var(--ink) 15%, transparent)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "#310752", fontSize: 12, fontWeight: 700 }}
                  />
                  <Tooltip />
                  <Radar
                    name="Taste"
                    dataKey="value"
                    stroke="#FFDF6E"
                    strokeWidth={3}
                    fill="#FFDF6E"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  const displayName = displayProfile?.username ?? "Friend";

  return (
    <section className="profile-panel">
      <span className="profile-decor" style={{ top: "1rem", right: "-1.5rem" }} aria-hidden>
        <Sun size={100} />
      </span>
      <span
        className="profile-decor"
        style={{ bottom: "15rem", left: "-1rem", color: "var(--ink)", opacity: 0.1 }}
        aria-hidden
      >
        <Donut size={60} />
      </span>

      <div className="profile-hero">
        <div className="profile-avatar" aria-hidden>
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="profile-name">{displayName}</h1>
          <p className="profile-sub">DNA Profile: {dnaLabel}</p>
          {displayProfile?.email ? (
            <p className="profile-sub">{displayProfile.email}</p>
          ) : null}
        </div>
      </div>

      <div className="profile-radar-wrap">
        <h2>Taste DNA</h2>
        <div className="profile-radar-card">
          {radarData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="color-mix(in srgb, var(--ink) 15%, transparent)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "#310752", fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip />
                <Radar
                  name="Taste"
                  dataKey="value"
                  stroke="#FFDF6E"
                  strokeWidth={3}
                  fill="#FFDF6E"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="dna-lede">Rate dishes to shape your Taste DNA.</p>
          )}
        </div>
      </div>

      <div className="profile-settings">
        <h2>Settings</h2>
        <div className="profile-settings-list">
          <button type="button" className="profile-setting" disabled>
            <span className="profile-setting-icon" aria-hidden>
              <Bell size={ICON_MD} strokeWidth={ICON_STROKE} />
            </span>
            <span>Notifications</span>
            <span className="profile-setting-value">Soon</span>
            <ChevronRight size={ICON_MD} strokeWidth={ICON_STROKE} aria-hidden />
          </button>
          <Link href="/dna" className="profile-setting">
            <span className="profile-setting-icon" aria-hidden>
              <MapPin size={ICON_MD} strokeWidth={ICON_STROKE} />
            </span>
            <span>Location Preferences</span>
            <span className="profile-setting-value">Stats</span>
            <ChevronRight size={ICON_MD} strokeWidth={ICON_STROKE} aria-hidden />
          </Link>
          <button
            type="button"
            className="profile-setting"
            onClick={() => setShowDiet((v) => !v)}
            aria-expanded={showDiet}
          >
            <span className="profile-setting-icon" aria-hidden>
              <Leaf size={ICON_MD} strokeWidth={ICON_STROKE} />
            </span>
            <span>Dietary Needs</span>
            <span className="profile-setting-value">
              {showDiet ? "Open" : "Edit"}
            </span>
            <ChevronRight size={ICON_MD} strokeWidth={ICON_STROKE} aria-hidden />
          </button>
        </div>
        {showDiet ? (
          <div style={{ marginTop: "1rem" }}>
            <DietaryPrefsEditor />
          </div>
        ) : null}
      </div>

      <div className="profile-signout">
        <button
          type="button"
          className="cta-secondary"
          style={{ width: "100%", color: "#b42318" }}
          onClick={() => void onSignOut()}
          disabled={pending}
        >
          <LogOut size={ICON_MD} strokeWidth={ICON_STROKE} aria-hidden />
          Sign Out
        </button>

        {deleteStep === "idle" ? (
          <button
            type="button"
            className="text-link"
            style={{ marginTop: "1rem" }}
            onClick={() => setDeleteStep("confirm")}
            disabled={pending}
          >
            Delete account
          </button>
        ) : (
          <div style={{ marginTop: "1rem" }}>
            <p className="dna-lede">This cannot be undone.</p>
            <button
              type="button"
              className="cta-secondary"
              onClick={() => void onDeleteAccount()}
              disabled={pending}
            >
              Confirm delete
            </button>
            <button
              type="button"
              className="text-link"
              onClick={() => setDeleteStep("idle")}
              disabled={pending}
            >
              Cancel
            </button>
            {deleteError ? (
              <p className="auth-error" role="alert">
                {deleteError}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
