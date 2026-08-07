import { NextResponse } from "next/server";
import { ask, isAiConfigured, sanitizeLine } from "@/lib/ai";
import { readJson, withRoute } from "@/lib/api-route";
import { recipeChatBodySchema } from "@/lib/api-schemas";
import { CATALOG } from "@/lib/catalog";
import { clientRateKey, enforceRateLimit } from "@/lib/rate-limit";

const FALLBACK =
  "I am having trouble connecting right now. Check the recipe steps on this page.";

const RULES = [
  "You are a sous chef helper inside Mood Taster.",
  "Help with substitutions, timing, heat, and plating for THIS recipe only.",
  "Never invent a new recipe or replace the ingredient list or steps.",
  "Speak simply. One or two short sentences. No em dashes.",
  "If the ask is unrelated to cooking this dish, say you can only help with this recipe.",
].join(" ");

export const POST = withRoute(
  "recipe-chat",
  "Could not chat about recipe",
  async (request) => {
    const envelope = recipeChatBodySchema.safeParse(await readJson(request));
    if (!envelope.success) {
      return NextResponse.json({ error: "Invalid chat request" }, { status: 400 });
    }

    const food = CATALOG.find((f) => f.id === envelope.data.foodId);
    if (!food?.recipe) {
      return NextResponse.json({ error: "Unknown recipe" }, { status: 404 });
    }

    if (!isAiConfigured()) {
      return NextResponse.json({ text: FALLBACK });
    }

    if (!(await enforceRateLimit(clientRateKey(request, "recipe-chat"), {
      capacity: 12,
      refillPerMs: 12 / 60_000,
    }))) {
      return NextResponse.json({ text: FALLBACK });
    }

    const recipe = food.recipe;
    const historyBlock = envelope.data.history
      .slice(-8)
      .map((m) => `${m.role === "user" ? "User" : "Chef"}: ${m.text}`)
      .join("\n");

    const raw = await ask({
      instructions: RULES,
      input: [
        `Dish: ${food.name}`,
        `Time: ${recipe.timeMinutes} min. Servings: ${recipe.servings}.`,
        `Ingredients: ${recipe.ingredients.join("; ")}.`,
        `Steps: ${recipe.steps.join(" ")}`,
        historyBlock ? `Recent chat:\n${historyBlock}` : "No prior chat.",
        `User: ${envelope.data.message}`,
      ].join("\n"),
      maxOutputTokens: 160,
    });

    const text = raw ? sanitizeLine(raw, 280) : null;
    return NextResponse.json({ text: text ?? FALLBACK });
  },
);
