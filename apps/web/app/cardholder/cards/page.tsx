"use client";

import React from "react";

type SavedCard = {
  id: string;
  bin: string;
  last4: string;
  issuer: string | null;
  network: string | null;
  brand: string | null;
  label: string | null;
  isActive: boolean;
  createdAt?: string | Date | null;
};

// Optional local BIN hints (can extend later)
const LOCAL_BIN_TABLE: Record<
  string,
  { issuer?: string; network?: string; brand?: string; description?: string }
> = {
  // Examples – extend later when you have more data
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
  const [lookupMessage, setLookupMessage] = React.useState<
    string | null
  >(null);
  const [lastLookupBin, setLastLookupBin] = React.useState<string | null>(null);

  const [saving, setSaving] = React.useState(false);
  const [savingError, setSavingError] = React.useState<string | null>(null);

  const [cards, setCards] = React.useState<SavedCard[]>([]);
  const [loadingCards, setLoadingCards] = React.useState(true);
  const [cardsError, setCardsError] = React.useState<string | null>(null);

  // Load existing saved cards
  React.useEffect(() => {
    async function loadCards() {
      try {
        setLoadingCards(true);
        const res = await fetch("/api/cardholder/cards");
        const data = await res.json();

        if (!data?.ok || !Array.isArray(data.cards)) {
          throw new Error("Could not load saved cards");
        }
        setCards(data.cards);
      } catch (err) {
        console.error("Failed to load saved cards", err);
        setCardsError("Could not load saved cards.");
      } finally {
        setLoadingCards(false);
      }
    }

    loadCards();
  }, []);

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
            "No data found for this BIN from the public lookup service. Please fill issuer, network and brand manually."
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
      setLookupMessage(
        `Auto-detected from public BIN service: ${parts.join(" • ")}`
      );

      if (!issuerLocked && data.issuer) setIssuer(data.issuer);
      if (!networkLocked && data.network) setNetwork(data.network);
      if (!brandLocked && data.brand) setBrand(data.brand);

      setLastLookupBin(clean);
    } catch (error) {
      console.error("BIN lookup failed", error);
      setLookupStatus("error");
      setLookupMessage(
        "Something went wrong while checking the BIN. Please fill issuer, network and brand manually."
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

      const res = await fetch("/api/cardholder/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
            In Phase-1, cards are linked to your demo cardholder account. We
            only store the first 6 and last 4 digits for matching offers. Later,
            this will connect to your logged-in cardholder profile.
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
              Enter the first 6 digits and last 4 digits of your card. We&apos;ll
              use both a local BIN table and a public BIN lookup to suggest
              issuer, network, and brand. If anything looks different from your
              actual card, please correct it manually.
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
                  className="w-full rounded-lg border border-neutral-700 bg-black/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                  className="w-full rounded-lg border border-neutral-700 bg-black/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                    ? "text-amber-300"
                    : "text-emerald-300"
                }`}
              >
                {lookupMessage}
              </p>
            )}

            <p className="text-[11px] text-neutral-500">
              These details are suggestions from a local + public BIN service.
              If anything looks different from your card, please correct them
              manually.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-xs text-neutral-300">
                  Issuer (optional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-neutral-700 bg-black/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. HDFC Bank"
                  value={issuer}
                  onChange={(e) => {
                    setIssuer(e.target.value);
                    setIssuerLocked(true);
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-neutral-300">
                  Network (optional)
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-neutral-700 bg-black/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="e.g. VISA / Mastercard / RuPay"
                  value={network}
                  onChange={(e) => {
                    setNetwork(e.target.value);
                    setNetworkLocked(true);
                  }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-neutral-300">
                Brand / Product (optional)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-neutral-700 bg-black/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. Regalia, SBI PRIME"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  setBrandLocked(true);
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs text-neutral-300">
                Label (optional)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-neutral-700 bg-black/70 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. My HDFC Regalia"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            {savingError && (
              <p className="text-xs text-red-400 mt-1">{savingError}</p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save card"}
              </button>
            </div>
          </form>

          {/* Right: Saved cards */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Saved cards</h2>
              <span className="text-[11px] text-neutral-400">
                {cards.length} {cards.length === 1 ? "active" : "active"}
              </span>
            </div>

            {loadingCards ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-neutral-500">Loading cards…</p>
              </div>
            ) : cardsError ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-red-400">{cardsError}</p>
              </div>
            ) : cards.length === 0 ? (
              <div className="flex-1 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 flex items-center justify-center px-3 py-6">
                <p className="text-xs text-neutral-500 text-center">
                  No cards saved yet. Add at least one card so buyers can see
                  that this network/issuer is available in Runesse.
                </p>
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-lg border border-neutral-700 bg-black/60 px-3 py-2.5 text-xs flex justify-between items-start gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-100">
                        {card.label || "One card"}
                      </p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        BIN {card.bin} • **** {card.last4 || "••••"}
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-0.5 truncate">
                        {card.issuer || "Unknown issuer"}{" "}
                        {card.network ? `• ${card.network}` : ""}{" "}
                        {card.brand ? `• ${card.brand}` : ""}
                      </p>
                      {card.createdAt && (
                        <p className="text-[10px] text-neutral-500 mt-0.5">
                          Added on {formatDate(card.createdAt)}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(card.id)}
                      className="inline-flex items-center rounded-full bg-red-900/70 px-3 py-1 text-[11px] font-medium text-red-100 hover:bg-red-800/90"
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