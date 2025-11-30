// apps/web/app/buyer/cards/page.tsx
"use client";

import React from "react";

type PublicCard = {
  id: string;
  label: string | null;
  issuer: string | null;
  brand: string | null;
  network: string | null;
  country: string | null;
  last4: string;
};

export default function BuyerCardsPage() {
  const [cards, setCards] = React.useState<PublicCard[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/buyer/cards");
        const data = await res.json();
        if (!data?.ok) {
          throw new Error(data?.error || "Could not load cards");
        }
        setCards(data.cards || []);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load cards");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-lg font-semibold text-slate-50">
        Available cards
      </h1>
      <p className="mt-2 text-sm text-slate-300">
        These are the cards that cardholders have registered in Runesse. When
        you create a request, we use these to match you with the best offers.
      </p>

      {loading && (
        <p className="mt-4 text-xs text-slate-400">Loading cards...</p>
      )}

      {error && (
        <p className="mt-4 text-xs text-red-400">
          {error || "Something went wrong while loading cards."}
        </p>
      )}

      {!loading && cards.length === 0 && !error && (
        <p className="mt-4 text-xs text-slate-500">
          No cards have been registered yet. Once cardholders start saving their
          cards, you&apos;ll see them here.
        </p>
      )}

      {cards.length > 0 && (
        <div className="mt-5 space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              className="rounded-lg border border-slate-800 bg-black/70 px-3 py-2 text-xs flex items-center justify-between"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-slate-100">
                  {card.label || `**** ${card.last4}`}
                </span>
                <span className="text-[11px] text-slate-400">
                  {[card.issuer, card.brand, card.network]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[11px] text-slate-400">
                  **** {card.last4}
                </span>
                <span className="block text-[11px] text-slate-500">
                  {card.country || "IN"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
