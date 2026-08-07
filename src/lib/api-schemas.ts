import { z } from "zod";

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
