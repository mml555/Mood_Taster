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

/** Ids the session has already burned through. Capped so a crafted body cannot
 * hand the ranker an unbounded list to filter against. */
const sessionIdListSchema = z
  .array(z.string().trim().min(1).max(120))
  .max(500)
  .optional();

export const matchBodySchema = z.object({
  answers: z.unknown(),
  dna: z.unknown().optional(),
  dietary: z.unknown().optional(),
  favoriteIds: z.unknown().optional(),
  rejectedIds: sessionIdListSchema,
  servedIds: sessionIdListSchema,
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
  createdAt: z.string().trim().min(10).max(40).optional(),
});

export const historyPatchSchema = z.object({
  id: z.string().trim().min(1).max(80),
  rating: z.enum(["nailed", "kinda", "nope"]),
});

/** PUT /api/favorites body. Unknown ids are dropped in parseFavoriteIds. */
export const favoritesBodySchema = z.object({
  foodIds: z.array(z.string().trim().min(1).max(120)).max(200),
});

const placeLabelSchema = z.enum(["best", "closest", "wildcard"]);

/** Soft client/server shape for /api/places. Missing enrichments default to null. */
export const nearbyPlaceSchema = z.object({
  name: z.string().min(1),
  address: z.string().default(""),
  rating: z.number().nullable().catch(null),
  mapsUri: z.string().nullable().catch(null),
  miles: z.number().nullable().catch(null),
  price: z.string().nullable().catch(null),
  openNow: z.boolean().nullable().catch(null),
  label: placeLabelSchema.nullable().catch(null),
});

export const placesResponseSchema = z.object({
  places: z
    .array(z.unknown())
    .default([])
    .transform((items) =>
      items.flatMap((item) => {
        const parsed = nearbyPlaceSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }),
    ),
  lat: z.number().optional(),
  lng: z.number().optional(),
  geoError: z.boolean().optional(),
});

export function parsePlacesResponse(raw: unknown) {
  const parsed = placesResponseSchema.safeParse(raw);
  if (!parsed.success) {
    return { places: [] as z.infer<typeof nearbyPlaceSchema>[] };
  }
  return parsed.data;
}
