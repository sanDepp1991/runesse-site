"use client";

import React from "react";
import Link from "next/link";

type RequestStatus = "PENDING" | "MATCHED" | "COMPLETED" | "CANCELLED" | string;

interface RequestItem {
  id: string;
  productName?: string | null;
  productLink?: string | null;
  checkoutPrice?: number | null;
  status?: RequestStatus;
  createdAt?: string | Date | null;
  matchedAt?: string | Date | null;
  completedAt?: string | Date | null;
}

function statusPillClasses(status: RequestStatus) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "PENDING") {
    return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
  }
  if (s === "MATCHED") {
    return "bg-sky-500/10 text-sky-300 border border-sky-500/40";
  }
  if (s === "COMPLETED") {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
  }
  if (s === "CANCELLED") {
    return "bg-red-500/10 text-red-300 border border-red-500/40";
  }
  return "bg-neutral-800/70 text-neutral-200 border border-neutral-700";
}

function statusLabel(status: RequestStatus) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "MATCHED") return "Matched";
  if (s === "COMPLETED") return "Completed";
  if (s === "CANCELLED") return "Cancelled";
  return s;
}

function formatDate(value?: string | Date | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function formatPrice(value?: number | null) {
  if (value == null) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

type CardListColumnProps = {
  title: string;
  subtitle: string;
  items: RequestItem[];
  emptyMessage: string;
  showTakeButton?: boolean;
  onTakeRequest?: (id: string) => void;
};

function CardListColumn({
  title,
  subtitle,
  items,
  emptyMessage,
  showTakeButton,
  onTakeRequest,
}: CardListColumnProps) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
      <h2 className="text-sm font-semibold mb-1">{title}</h2>
      <p className="text-xs text-neutral-400 mb-3">{subtitle}</p>

      {items.length === 0 ? (
        <div className="flex-1 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 flex items-center justify-center px-3 py-6">
          <p className="text-xs text-neutral-500 text-center">{emptyMessage}</p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {items.map((req) => {
            const status = (req.status || "PENDING").toUpperCase();
            const canTake =
              showTakeButton && status === "PENDING" && !!onTakeRequest;

            return (
              <div
                key={req.id}
                className="rounded-lg border border-neutral-700 bg-black/60 px-3 py-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/cardholder/request/${req.id}`}
                      className="block"
                    >
                      <p className="text-neutral-100 font-medium truncate">
                        {req.productName || "Unnamed product"}
                      </p>
                      {req.productLink && (
                        <p className="mt-0.5 text-[11px] text-neutral-500 truncate">
                          {req.productLink}
                        </p>
                      )}
                    </Link>
                  </div>

                  {req.status && (
                    <span
                      className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium whitespace-nowrap ${statusPillClasses(
                        req.status
                      )}`}
                    >
                      {statusLabel(req.status)}
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex justify-between items-center text-[11px] text-neutral-500">
                  <span>{formatPrice(req.checkoutPrice ?? null)}</span>
                  <span>{formatDate(req.createdAt)}</span>
                </div>

                {canTake && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onTakeRequest(req.id)}
                      className="rounded-full border border-sky-500/70 bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-200 hover:bg-sky-500/20 transition"
                    >
                      I can take this
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const DEMO_CARDHOLDER_EMAIL = "cardholder@demo.runesse";

const CardholderPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RequestItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  // Card selection state
  const [saving, setSaving] = React.useState(false);
  const [selectForRequestId, setSelectForRequestId] = React.useState<
    string | null
  >(null);
  const [savedCards, setSavedCards] = React.useState<any[] | null>(null);
  const [cardError, setCardError] = React.useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/requests/list");
        const data = await res.json();

        if (!data?.ok || !Array.isArray(data.requests)) {
          throw new Error("Could not load requests");
        }

        setItems(data.requests);
      } catch (e) {
        console.error("Failed to load requests for cardholder", e);
        setError("Could not load requests.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const available = items.filter(
    (r) => (r.status || "PENDING").toUpperCase() === "PENDING"
  );
  const inProgress = items.filter(
    (r) => (r.status || "").toUpperCase() === "MATCHED"
  );
  const completed = items.filter(
    (r) => (r.status || "").toUpperCase() === "COMPLETED"
  );

  async function openCardSelectorForRequest(requestId: string) {
    try {
      setCardError(null);
      setSaving(false);
      setSelectedCardId(null);
      setSelectForRequestId(requestId);

      const res = await fetch("/api/cardholder/cards");
      const data = await res.json();
      if (!data?.ok) {
        throw new Error(data?.error || "Could not load your cards");
      }

      if (!data.cards || data.cards.length === 0) {
        setCardError(
          "You do not have any saved cards yet. Please add at least one card in the 'Save my cards' page."
        );
      }
      setSavedCards(data.cards || []);
    } catch (e: any) {
      console.error(e);
      setCardError(e?.message || "Failed to load cards");
      setSavedCards([]);
    }
  }

  async function confirmTakeRequestWithCard() {
    if (!selectForRequestId || !selectedCardId) {
      setCardError("Please choose a card.");
      return;
    }
    try {
      setSaving(true);
      setCardError(null);

      const res = await fetch("/api/cardholder/requests/take-with-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectForRequestId,
          savedCardId: selectedCardId,
          cardholderEmail: DEMO_CARDHOLDER_EMAIL,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to take this request");
      }

      // Close dialog
      setSelectForRequestId(null);
      setSelectedCardId(null);
      setSavedCards(null);

      // Refresh list
      window.location.reload();
    } catch (e: any) {
      console.error(e);
      setCardError(e?.message || "Failed to take this request");
    } finally {
      setSaving(false);
    }
  }

  function closeCardSelector() {
    setSelectForRequestId(null);
    setSelectedCardId(null);
    setSavedCards(null);
    setCardError(null);
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Hero / intro */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-400">
            Cardholder • Runesse
          </p>
          <h1 className="mt-2 text-xl font-semibold sm:text-2xl">
            See which requests you can help with.
          </h1>
          <p className="mt-2 text-sm text-neutral-300 max-w-2xl">
            In Phase-1, you can view buyer requests, pick the ones that match
            your card offers, and later upload invoice and card proofs for admin
            verification.
          </p>
        </section>

        {/* 3-column layout */}
        <section className="grid gap-4 md:grid-cols-3">
          {/* How this works – static */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-2 text-xs">
            <h2 className="text-sm font-semibold mb-1">How this works</h2>
            <p className="text-neutral-300">
              This is a Phase-1 mock. Matching and uploads are local so you can
              feel the flow before we connect real payments and storage.
            </p>
            <ul className="mt-2 space-y-1.5 text-neutral-400">
              <li>• Buyer creates a request from their workspace.</li>
              <li>• You view open requests here as a cardholder.</li>
              <li>
                • After using your card, you&apos;ll upload invoice & proof
                (coming soon).
              </li>
              <li>• Admin verifies and marks the trade as completed.</li>
            </ul>
          </div>

          {/* Available requests – real data */}
          <CardListColumn
            title="Available requests"
            subtitle="Buyer requests that are still open. Pick the ones that match your cards."
            items={available}
            emptyMessage={
              loading
                ? "Loading requests..."
                : error
                ? error
                : "No open requests right now. Once buyers create requests, they will appear here."
            }
            showTakeButton
            onTakeRequest={openCardSelectorForRequest}
          />

          {/* Matched + Completed stacked on small screens */}
          <div className="flex flex-col gap-4">
            {/* Matched / in progress */}
            <CardListColumn
              title="Matched / in progress"
              subtitle="Requests that are already matched with a cardholder and may need your invoice / proof."
              items={inProgress}
              emptyMessage={
                loading
                  ? "Loading requests..."
                  : "No matched requests yet. Once you or another cardholder picks a request, it will appear here."
              }
            />

            {/* Completed trades */}
            <CardListColumn
              title="Completed trades"
              subtitle="Requests that have been marked completed by admin."
              items={completed}
              emptyMessage={
                loading
                  ? "Loading requests..."
                  : "No completed trades yet. Once admin completes a matched request, it will appear here."
              }
            />
          </div>
        </section>
      </div>

      {/* Card selector overlay */}
      {selectForRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-5">
            <h2 className="text-sm font-semibold text-neutral-50">
              Choose card for this request
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              Select which saved card you will use to pay for this buyer&apos;s
              order.
            </p>

            {cardError && (
              <p className="mt-2 text-xs text-red-400">{cardError}</p>
            )}

            {!savedCards && !cardError && (
              <p className="mt-3 text-xs text-neutral-400">
                Loading your cards...
              </p>
            )}

            {savedCards && savedCards.length > 0 && (
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {savedCards.map((card: any) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCardId(card.id)}
                    className={[
                      "w-full rounded-lg border px-3 py-2 text-left text-xs",
                      selectedCardId === card.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-neutral-700 bg-black/60 hover:border-neutral-500",
                    ].join(" ")}
                  >
                    <div className="font-medium text-neutral-100">
                      {card.label || `**** ${card.last4}`}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {[card.issuer, card.brand, card.network]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      BIN {card.bin} · **** {card.last4} ·{" "}
                      {card.country || "IN"}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCardSelector}
                className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTakeRequestWithCard}
                disabled={saving || !selectedCardId}
                className="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardholderPage;
