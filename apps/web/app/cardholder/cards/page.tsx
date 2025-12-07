"use client";

import React from "react";
import { supabase } from "../../lib/supabaseClient";

type SavedCard = {
  id: string;
  bin: string;
  last4: string;
  issuer: string | null;
  network: string | null;
  brand: string | null;
  label: string | null;
  country?: string | null;
  isActive: boolean;
  createdAt?: string | Date | null;
};

// Optional local BIN hints (can extend later)
const LOCAL_BIN_TABLE: Record<
  string,
  { issuer?: string; network?: string; brand?: string; description?: string }
> = {
  // Example – extend later when you have more data
  "471227": {
    issuer: "BANK OF BARODA",
    network: "VISA",
    brand: "One card",
    description: "BANK OF BARODA • VISA • One card (IN)",
  },
};

type LookupStatus = "idle" | "checking" | "done" | "error";

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

const CardholderCardsPage: React.FC = () => {
  // Form state
  const [bin, setBin] = React.useState("");
  const [last4, setLast4] = React.useState("");
  const [issuer, setIssuer] = React.useState("");
  const [network, setNetwork] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [label, setLabel] = React.useState("");

  const [issuerLocked, setIssuerLocked] = React.useState(false);
  const [networkLocked, setNetworkLocked] = React.useState(false);
  const [brandLocked, setBrandLocked] = React.useState(false);

  const [lookupStatus, setLookupStatus] = React.useState<LookupStatus>("idle");
  const [lookupMessage, setLookupMessage] = React.useState<string | null>(null);
  const [lastLookupBin, setLastLookupBin] = React.useState<string | null>(null);

  const [saving, setSaving] = React.useState(false);
  const [savingError, setSavingError] = React.useState<string | null>(null);

  const [cards, setCards] = React.useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = React.useState(true);
  const [cardsError, setCardsError] = React.useState<string | null>(null);

  const [token, setToken] = React.useState<string | null>(null);

  // Load Supabase session → access token
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setToken(session?.access_token ?? null);
    });
  }, []);

  // Helper to build headers with Authorization (if token present)
  const authHeaders = React.useCallback(
    (extra: HeadersInit = {}): HeadersInit =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            ...extra,
          }
        : extra,
    [token],
  );

  // Load existing saved cards for this cardholder
  React.useEffect(() => {
    async function loadCards() {
      try {
        setLoadingCards(true);
        setCardsError(null);

        const res = await fetch("/api/cardholder/cards", {
          headers: authHeaders(),
        });
        const data = await res.json();

        if (!data?.ok || !Array.isArray(data.cards)) {
          throw new Error(data?.error || "Could not load saved cards");
        }
        setCards(data.cards);
      } catch (err) {
        console.error("Failed to load saved cards", err);
        setCardsError("Could not load saved cards.");
        setCards([]);
      } finally {
        setLoadingCards(false);
      }
    }

    loadCards();
  }, [authHeaders]);

  function normalizedBin(value: string) {
    return value.replace(/\D/g, "").slice(0, 8);
  }

  async function runBinLookup(rawBin: string) {
    const clean = normalizedBin(rawBin);

    if (clean.length < 6) {
      setLookupStatus("idle");
      setLookupMessage(null);
      return;
    }

    setLookupStatus("checking");
    setLookupMessage("Checking BIN details…");

    // 1) Local table first
    const local = LOCAL_BIN_TABLE[clean.slice(0, 6)];
    if (local) {
      const msg = local.description
        ? `Auto-detected from local Runesse BIN table: ${local.description}`
        : `Auto-detected from local Runesse BIN table.`;

      setLookupStatus("done");
      setLookupMessage(msg);

      // Only overwrite fields if user has not manually edited them
      if (!issuerLocked && local.issuer) setIssuer(local.issuer);
      if (!networkLocked && local.network) setNetwork(local.network);
      if (!brandLocked && local.brand) setBrand(local.brand);

      setLastLookupBin(clean);
      return;
    }

    // 2) Neutrino (public BIN service)
    try {
      const res = await fetch("/api/bin-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bin: clean }),
      });

      const data = await res.json().catch(() => null);

      if (!data || data.ok === false || (!data.issuer && !data.network && !data.brand)) {
        setLookupStatus("error");
        setLookupMessage(
          data?.error ||
            "No data found for this BIN from the public lookup service. Please fill issuer, network and brand manually.",
        );
        setLastLookupBin(clean);
        return;
      }

      const parts: string[] = [];
      if (data.issuer) parts.push(data.issuer);
      if (data.network) parts.push(data.network);
      if (data.brand) parts.push(data.brand);
      if (data.country) parts.push(data.country);

      setLookupStatus("done");
      setLookupMessage(`Auto-detected from public BIN service: ${parts.join(" • ")}`);

      if (!issuerLocked && data.issuer) setIssuer(data.issuer);
      if (!networkLocked && data.network) setNetwork(data.network);
      if (!brandLocked && data.brand) setBrand(data.brand);

      setLastLookupBin(clean);
    } catch (error) {
      console.error("BIN lookup failed", error);
      setLookupStatus("error");
      setLookupMessage(
        "Something went wrong while checking the BIN. Please fill issuer, network and brand manually.",
      );
    }
  }

  // Whenever BIN changes, run lookup – and unlock auto-fill for the new BIN
  const handleBinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const clean = normalizedBin(value);

    setBin(clean);

    // If BIN actually changed (not just re-typing same digits),
    // allow auto-fill again for this new BIN.
    if (!lastLookupBin || clean.slice(0, 6) !== lastLookupBin.slice(0, 6)) {
      setIssuerLocked(false);
      setNetworkLocked(false);
      setBrandLocked(false);

      // Clear previous suggestions (so user sees new values)
      setIssuer("");
      setNetwork("");
      setBrand("");
      setLookupStatus("idle");
      setLookupMessage(null);
    }

    if (clean.length >= 6) {
      void runBinLookup(clean);
    } else {
      setLookupStatus("idle");
      setLookupMessage(null);
    }
  };

  async function handleSaveCard(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavingError(null);

    try {
      const payload = {
        bin: normalizedBin(bin).slice(0, 6),
        last4: last4.replace(/\D/g, "").slice(0, 4),
        issuer: issuer.trim() || null,
        network: network.trim() || null,
        brand: brand.trim() || null,
        label: label.trim() || null,
      };

      if (!payload.bin || payload.bin.length < 6) {
        throw new Error("Please enter at least the first 6 digits of the card.");
      }

      if (!payload.last4 || payload.last4.length !== 4) {
        throw new Error("Please enter the last 4 digits of the card.");
      }

      const res = await fetch("/api/cardholder/cards", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data?.ok) {
        throw new Error(data?.error || "Could not save card");
      }

      // Add to local list
      if (data.card) {
        setCards((prev) => [data.card, ...prev]);
      }

      // Reset form
      setBin("");
      setLast4("");
      setIssuer("");
      setNetwork("");
      setBrand("");
      setLabel("");
      setLookupStatus("idle");
      setLookupMessage(null);
      setLastLookupBin(null);
      setIssuerLocked(false);
      setNetworkLocked(false);
      setBrandLocked(false);
    } catch (err: any) {
      console.error("Failed to save card", err);
      setSavingError(err.message || "Could not save card.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveCard(id: string) {
    try {
      const res = await fetch("/api/cardholder/cards", {
        method: "DELETE",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!data?.ok) {
        throw new Error(data?.error || "Could not remove card");
      }

      setCards((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to remove card", err);
      alert("Could not remove card. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
            Cardholder • Save my cards
          </p>
          <h1 className="mt-2 text-xl font-semibold sm:text-2xl">
            Tell Runesse which cards you have.
          </h1>
          <p className="mt-2 text-sm text-neutral-300 max-w-3xl">
            In Phase-1, cards are linked to your logged-in cardholder account. We only store
            the first 6 and last 4 digits for matching offers.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* Left: Add a card */}
          <form
            className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4"
            onSubmit={handleSaveCard}
          >
            <h2 className="text-sm font-semibold mb-1">Add a card</h2>
            <p className="text-xs text-neutral-400 mb-2">
              Enter the first 6 digits and last 4 digits of your card. We&apos;ll use both a
              local BIN table and a public BIN lookup to suggest issuer, network, and brand.
              If anything looks different from your actual card, please correct it manually.
            </p>

            <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-3">
              <div className="space-y-1">
                <label className="block text-xs text-neutral-300">
                  BIN (first 6 digits)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  className="w-full rounded-lg border border-neutral-800 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. 414720"
                  value={bin}
                  onChange={handleBinChange}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-neutral-300">
                  Last 4 digits
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  className="w-full rounded-lg border border-neutral-800 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. 1234"
                  value={last4}
                  onChange={(e) =>
                    setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                />
              </div>
            </div>

            {lookupMessage && (
              <p
                className={`text-[11px] ${
                  lookupStatus === "error"
                    ? "text-red-400"
                    : lookupStatus === "done"
                    ? "text-emerald-400"
                    : "text-neutral-400"
                }`}
              >
                {lookupMessage}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="block text-xs text-neutral-300">Issuer</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-neutral-800 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. HDFC BANK"
                  value={issuer}
                  onChange={(e) => {
                    setIssuer(e.target.value);
                    setIssuerLocked(true);
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-neutral-300">Network</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-neutral-800 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. VISA / MASTERCARD / RUPAY"
                  value={network}
                  onChange={(e) => {
                    setNetwork(e.target.value);
                    setNetworkLocked(true);
                  }}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs text-neutral-300">Brand / Variant</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-neutral-800 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. Millennia / Regalia / OneCard"
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    setBrandLocked(true);
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-neutral-300">
                Custom label <span className="text-neutral-500">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-neutral-800 bg-black/40 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Amazon shopping card"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <p className="text-[11px] text-neutral-500">
                This is how the card will appear in your Runesse inbox (only to you).
              </p>
            </div>

            {savingError && (
              <p className="text-[11px] text-red-400 mt-1">{savingError}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save card"}
            </button>
          </form>

          {/* Right: Saved cards list */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
            <h2 className="text-sm font-semibold mb-1">Your saved cards</h2>
            <p className="text-xs text-neutral-400 mb-2">
              Runesse will only send you buyer requests that match the issuer, network and
              label of these cards.
            </p>

            {cardsError && (
              <p className="text-[11px] text-red-400 mb-1">{cardsError}</p>
            )}

            {loadingCards ? (
              <p className="text-xs text-neutral-400">Loading saved cards…</p>
            ) : cards.length === 0 ? (
              <p className="text-xs text-neutral-400">
                You have not saved any cards yet. Add at least one card to start receiving
                matching requests.
              </p>
            ) : (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-start justify-between rounded-xl border border-neutral-800 bg-black/40 px-3 py-2.5 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                          {card.issuer || "Unknown issuer"}
                        </span>
                        {card.network && (
                          <span className="inline-flex items-center rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-neutral-200">
                            {card.network}
                          </span>
                        )}
                        {card.brand && (
                          <span className="inline-flex items-center rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-200">
                            {card.brand}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-neutral-300">
                        BIN <span className="font-mono">{card.bin}</span> • Last 4{" "}
                        <span className="font-mono">{card.last4}</span>
                      </p>

                      {card.label && (
                        <p className="text-[11px] text-emerald-300">
                          Label: <span className="font-medium">{card.label}</span>
                        </p>
                      )}

                      {card.createdAt && (
                        <p className="text-[11px] text-neutral-500">
                          Saved on {formatDate(card.createdAt)}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleRemoveCard(card.id)}
                      className="ml-2 inline-flex items-center rounded-md border border-neutral-700 px-2 py-1 text-[10px] font-medium text-neutral-200 hover:bg-red-600/10 hover:border-red-500/70"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CardholderCardsPage;
