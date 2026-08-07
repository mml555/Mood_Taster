import { z } from "zod";
import { DNA_DIMENSIONS, normalizeDna } from "@/lib/dna";
import type { DnaEntry, DnaProfile } from "@/lib/taste-types";

export const USERNAME_RE = /^[a-z0-9_]{3,32}$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_RE, "Username: 3-32 chars, lowercase letters, numbers, underscore");

export const emailSchema = z.string().trim().email("Enter a valid email");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

export const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or username is required"),
  password: passwordSchema,
});

const dnaEntrySchema = z.object({
  score: z.number(),
  confidence: z.number(),
  samples: z.number(),
});

const dnaBucketSchema = z.record(z.string(), dnaEntrySchema);

/** v2 shape: prefs + experience buckets. */
const dnaProfileV2Schema = z.object({
  version: z.literal(2).optional(),
  prefs: dnaBucketSchema,
  experience: dnaBucketSchema,
});

/** Flat v1: one entry per dimension (pre-split). */
const dnaProfileV1Schema = z.record(z.string(), dnaEntrySchema);

/**
 * Accepts v2 or flat v1 JSON. Returns a normalized v2 profile, or null if
 * the payload has no recognizable DNA shape.
 * Empty v2 (reset) is valid; garbage objects are rejected.
 */
export function parseDnaProfile(raw: unknown): DnaProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;

  const looksV2 =
    source.version === 2 ||
    (source.prefs !== undefined && source.experience !== undefined);

  if (looksV2) {
    const asV2 = dnaProfileV2Schema.safeParse(raw);
    if (!asV2.success) return null;
    return normalizeDna(asV2.data);
  }

  const hasFlatDim = DNA_DIMENSIONS.some((dim) => {
    const entry = source[dim];
    if (!entry || typeof entry !== "object") return false;
    const e = entry as Partial<DnaEntry>;
    return (
      typeof e.score === "number" &&
      typeof e.confidence === "number" &&
      typeof e.samples === "number"
    );
  });

  if (!hasFlatDim) return null;

  const asV1 = dnaProfileV1Schema.safeParse(raw);
  if (!asV1.success) return null;
  return normalizeDna(asV1.data);
}
