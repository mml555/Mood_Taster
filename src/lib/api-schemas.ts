import { z } from "zod";
import { INTENTS } from "./taste-types";

/**
 * Shared request shapes for AI enhancement routes. parseAnswers still does the
 * domain validation; Zod only gates the outer envelope so bad JSON fails fast.
 */

export const explainBodySchema = z.object({
  foodId: z.string().trim().min(1).max(120),
  answers: z.unknown(),
});

export const adjustBodySchema = z.object({
  answers: z.unknown(),
  note: z.unknown(),
});

const historyPlaceSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    mapsUri: z.string().trim().max(500).nullable().optional(),
  })
  .nullable()
  .optional();

export const historyAppendSchema = z.object({
  id: z.string().trim().min(1).max(80),
  foodId: z.string().trim().min(1).max(120),
  intent: z.enum(INTENTS),
  rating: z.enum(["nailed", "kinda", "nope"]).nullable().optional(),
  answers: z.unknown().optional(),
  place: historyPlaceSchema,
  createdAt: z.string().datetime().optional(),
});

export const historyPatchSchema = z.object({
  id: z.string().trim().min(1).max(80),
  rating: z.enum(["nailed", "kinda", "nope"]),
});
