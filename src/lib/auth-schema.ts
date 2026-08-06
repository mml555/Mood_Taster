import { z } from "zod";
import { DNA_DIMENSIONS, createNeutralDna } from "@/lib/dna";
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

export function parseDnaProfile(raw: unknown): DnaProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as Record<string, unknown>;
  const dna = createNeutralDna();
  let any = false;

  for (const dim of DNA_DIMENSIONS) {
    const entry = source[dim];
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Partial<DnaEntry>;
    if (
      typeof e.score !== "number" ||
      typeof e.confidence !== "number" ||
      typeof e.samples !== "number"
    ) {
      continue;
    }
    dna[dim] = {
      score: clamp(e.score, 0, 1),
      confidence: clamp(e.confidence, 0, 1),
      samples: Math.max(0, Math.floor(e.samples)),
    };
    any = true;
  }

  return any ? dna : null;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
