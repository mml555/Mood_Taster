"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Bookmark,
  Send,
  Share2,
  ShoppingCart,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PressButton } from "@/components/ui/PressButton";
import {
  FAVORITES_KEY,
  isFavorite,
  readFavorites,
  toggleFavorite,
} from "@/lib/favorites";
import { persistFavorites } from "@/lib/favorites-sync";
import type { Food, Recipe } from "@/lib/taste-types";
import { ICON_MD, ICON_SM, ICON_STROKE } from "@/lib/ui-icons";

type ChatMessage = { role: "user" | "model"; text: string };

function difficultyLabel(minutes: number): string {
  if (minutes <= 15) return "Easy";
  if (minutes <= 35) return "Doable";
  return "Project";
}

export function RecipeExperience({
  food,
  recipe,
}: {
  food: Food;
  recipe: Recipe;
}) {
  const [tab, setTab] = useState<"recipe" | "chat">("recipe");
  const [shoppingList, setShoppingList] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      text: `Hi. I am your chef assistant. Need any substitutions or help making ${food.name}?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => setSaved(isFavorite(food.id)));
  }, [food.id]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== FAVORITES_KEY) return;
      setSaved(isFavorite(food.id, readFavorites()));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [food.id]);

  useEffect(() => {
    if (tab !== "chat") return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, tab]);

  const createShoppingList = useCallback(() => {
    setShoppingList([...recipe.ingredients]);
  }, [recipe.ingredients]);

  const onToggleSave = useCallback(() => {
    const next = toggleFavorite(food.id);
    setSaved(isFavorite(food.id, next));
    void persistFavorites(next);
  }, [food.id]);

  const shareList = useCallback(async () => {
    if (!shoppingList?.length) return;
    const text = `Shopping List for ${food.name}:\n${shoppingList
      .map((i) => `- ${i}`)
      .join("\n")}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Shopping List", text });
        return;
      }
      await navigator.clipboard.writeText(text);
    } catch {
      /* cancelled */
    }
  }, [food.name, shoppingList]);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = { role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/recipe-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foodId: food.id,
          message: trimmed,
          history: messages,
        }),
      });
      const data = (await res.json()) as { text?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text:
            data.text ??
            "Sorry, I am having trouble connecting right now.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I am having trouble connecting right now.",
        },
      ]);
    }
    setLoading(false);
  }, [food.id, input, loading, messages]);

  return (
    <section className="recipe-experience" aria-labelledby="recipe-exp-title">
      <div className="recipe-exp-top">
        <Link
          href={`/result/${food.id}`}
          className="press-btn press-btn-icon"
          aria-label="Back"
        >
          <ArrowLeft size={ICON_MD} strokeWidth={ICON_STROKE} aria-hidden />
        </Link>
        <h1 id="recipe-exp-title" className="recipe-exp-title">
          {food.name}
        </h1>
        <button
          type="button"
          className={
            saved
              ? "press-btn press-btn-icon is-saved"
              : "press-btn press-btn-icon"
          }
          onClick={onToggleSave}
          aria-pressed={saved}
          aria-label={saved ? "Saved" : "Save recipe"}
        >
          <Bookmark
            size={ICON_MD}
            strokeWidth={ICON_STROKE}
            fill={saved ? "currentColor" : "none"}
            aria-hidden
          />
        </button>
      </div>

      <div className="recipe-exp-tabs" role="tablist" aria-label="Recipe views">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "recipe"}
          className={
            tab === "recipe" ? "recipe-exp-tab is-active" : "recipe-exp-tab"
          }
          onClick={() => setTab("recipe")}
        >
          Recipe
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "chat"}
          className={
            tab === "chat" ? "recipe-exp-tab is-active" : "recipe-exp-tab"
          }
          onClick={() => setTab("chat")}
        >
          Sous Chef Chat
        </button>
      </div>

      {tab === "recipe" ? (
        <div className="recipe-exp-body">
          <Image
            src={food.image}
            alt={food.imageAlt}
            width={800}
            height={400}
            className="recipe-exp-image"
            priority
          />
          <div className="recipe-exp-meta">
            <div className="recipe-exp-meta-card">
              <span className="recipe-exp-meta-label">Prep Time</span>
              <span className="recipe-exp-meta-value">
                {recipe.timeMinutes} min
              </span>
            </div>
            <div className="recipe-exp-meta-card">
              <span className="recipe-exp-meta-label">Difficulty</span>
              <span className="recipe-exp-meta-value">
                {difficultyLabel(recipe.timeMinutes)}
              </span>
            </div>
          </div>

          <div className="recipe-exp-block">
            <h2 className="recipe-heading">Ingredients</h2>
            {shoppingList ? (
              <div className="recipe-shopping">
                <div className="recipe-shopping-head">
                  <span className="recipe-shopping-title">
                    <ShoppingCart
                      size={ICON_MD}
                      strokeWidth={ICON_STROKE}
                      aria-hidden
                    />
                    Shopping List
                  </span>
                  <button
                    type="button"
                    className="press-btn press-btn-icon"
                    onClick={() => void shareList()}
                    aria-label="Share shopping list"
                  >
                    <Share2
                      size={ICON_SM}
                      strokeWidth={ICON_STROKE}
                      aria-hidden
                    />
                  </button>
                </div>
                {shoppingList.map((item) => (
                  <label key={item}>
                    <input type="checkbox" />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            ) : (
              <>
                <ul className="recipe-ingredients">
                  {recipe.ingredients.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <PressButton
                  variant="secondary"
                  fullWidth
                  className="recipe-exp-cta"
                  onClick={createShoppingList}
                >
                  Create Shopping List
                </PressButton>
              </>
            )}
          </div>

          <div className="recipe-exp-block">
            <h2 className="recipe-heading">Steps</h2>
            <ol className="recipe-steps">
              {recipe.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <div className="recipe-chat">
          <div className="recipe-chat-messages">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={
                  msg.role === "user"
                    ? "recipe-chat-bubble recipe-chat-bubble-user"
                    : "recipe-chat-bubble recipe-chat-bubble-model"
                }
              >
                {msg.text}
              </div>
            ))}
            {loading ? (
              <div className="recipe-chat-bubble recipe-chat-bubble-model">
                Typing…
              </div>
            ) : null}
            <div ref={chatEndRef} />
          </div>
          <div className="recipe-chat-compose">
            <input
              className="recipe-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void send();
              }}
              placeholder="Ask about this recipe..."
              aria-label="Ask about this recipe"
              disabled={loading}
            />
            <PressButton
              variant="icon"
              className="recipe-chat-send"
              onClick={() => void send()}
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <Send size={ICON_MD} strokeWidth={ICON_STROKE} aria-hidden />
            </PressButton>
          </div>
        </div>
      )}
    </section>
  );
}
