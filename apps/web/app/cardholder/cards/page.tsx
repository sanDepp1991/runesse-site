"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRoleAccess } from "../../../lib/roleAccess";

type SavedCard = {
  id: string;
  createdAt: string;
  updatedAt: string;
  cardholderEmail: string;
  bin: string;
  last4: string;
  issuer: string | null;
  brand: string | null;
  network: string | null;
  country: string | null;
  label: string | null;
  isActive: boolean;
};

type ApiResponse =
  | { ok: true; cards: SavedCard[] }
  | { ok: true; card: SavedCard }
  | { ok: false; error: string };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function getBearerToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.access_token ?? null;
}

export default function CardholderCardsPage() {
  useRoleAccess("CARDHOLDER");

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bin, setBin] = useState("");
  const [last4, setLast4] = useState("");
  const [issuer, setIssuer] = useState("");
  const [network, setNetwork] = useState("");
  const [label, setLabel] = useState("");

  const canSubmit = useMemo(() => {
    const b = bin.trim();
    const l = last4.trim();
    return /^\d{6}$/.test(b) && /^\d{4}$/.test(l);
  }, [bin, last4]);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getBearerToken();
      if (!token) {
        setCards([]);
        setError("Not signed in. Please sign in again.");
        setLoading(false);
        return;
      }

      const r = await fetch("/api/cardholder/cards", {
        method: "GET",
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data: ApiResponse = await r.json();
      if (!r.ok || ("ok" in data && data.ok === false)) {
        setError((data as any)?.error || `Failed to load cards (HTTP ${r.status}).`);
        setCards([]);
      } else {
        const list = (data as any).cards as SavedCard[];
        setCards(Array.isArray(list) ? list : []);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load cards.");
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  async function onAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);

    try {
      const token = await getBearerToken();
      if (!token) {
        setError("Not signed in. Please sign in again.");
        return;
      }

      const payload = {
        bin: bin.trim(),
        last4: last4.trim(),
        issuer: issuer.trim() || null,
        network: network.trim() || null,
        label: label.trim() || null,
      };

      const r = await fetch("/api/cardholder/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await r.json();
      if (!r.ok || ("ok" in data && data.ok === false)) {
        setError((data as any)?.error || `Failed to save card (HTTP ${r.status}).`);
        return;
      }

      setBin("");
      setLast4("");
      setIssuer("");
      setNetwork("");
      setLabel("");
      await loadCards();
    } catch (e: any) {
      setError(e?.message || "Failed to save card.");
    } finally {
      setBusy(false);
    }
  }

  const panel =
    "rounded-2xl border border-neutral-800 bg-neutral-950/60 backdrop-blur px-6 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]";

  const labelCls = "text-sm font-medium text-neutral-200";
  const inputCls =
    "mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-neutral-600 focus:ring-2 focus:ring-neutral-700/40";

  const primaryBtn = cx(
    "rounded-xl px-4 py-2 text-sm font-medium",
    canSubmit && !busy
      ? "bg-neutral-100 text-neutral-900 hover:bg-neutral-200"
      : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
  );

  const secondaryBtn =
    "rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-2 text-sm font-medium text-neutral-100 hover:bg-neutral-900";

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-100">
          Saved Cards
        </h1>
        <p className="mt-1 text-sm text-neutral-400">
          Add the cards you want to receive matching requests for. BIN (6 digits) + last 4 are required.
        </p>
      </div>

      {/* Add Card */}
      <div className={panel}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-neutral-100">Add a card</h2>
          <div className="text-xs text-neutral-500">
            {busy ? "Saving…" : "Secure • Verified"}
          </div>
        </div>

        <form className="mt-5 grid gap-4" onSubmit={onAddCard}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>BIN (6 digits) *</label>
              <input
                value={bin}
                onChange={(e) => setBin(e.target.value)}
                inputMode="numeric"
                placeholder="e.g., 411111"
                className={inputCls}
              />
              <div className="mt-1 text-xs text-neutral-500">First 6 digits of your card</div>
            </div>

            <div>
              <label className={labelCls}>Last 4 digits *</label>
              <input
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                inputMode="numeric"
                placeholder="e.g., 1111"
                className={inputCls}
              />
              <div className="mt-1 text-xs text-neutral-500">Last 4 digits shown on your card</div>
            </div>

            <div>
              <label className={labelCls}>Issuer (optional)</label>
              <input
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="e.g., HDFC"
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Network (optional)</label>
              <input
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                placeholder="e.g., VISA"
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Label (optional)</label>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., My Primary Card"
                className={inputCls}
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-900/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="submit" disabled={!canSubmit || busy} className={primaryBtn}>
              {busy ? "Saving..." : "Save card"}
            </button>

            <button type="button" onClick={loadCards} className={secondaryBtn}>
              Refresh
            </button>

            <div className="ml-auto text-xs text-neutral-500">
              Tip: Save at least one card to receive requests in your inbox.
            </div>
          </div>
        </form>
      </div>

      {/* Cards List */}
      <div className={cx(panel, "mt-6")}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-neutral-100">Your cards</h2>
          <span className="text-sm text-neutral-400">
            {loading ? "Loading..." : `${cards.length} card(s)`}
          </span>
        </div>

        {loading ? (
          <div className="mt-4 text-sm text-neutral-400">Loading cards…</div>
        ) : cards.length === 0 ? (
          <div className="mt-4 text-sm text-neutral-400">
            No cards saved yet. Add your first card above.
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {cards.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-medium text-neutral-100">
                    {c.issuer || "Issuer"}{" "}
                    <span className="text-neutral-400">• {c.network || "Network"}</span>
                  </div>
                  <div className="text-sm text-neutral-300">
                    BIN {c.bin} • **** {c.last4}
                  </div>
                </div>

                {c.label ? (
                  <div className="mt-1 text-sm text-neutral-400">{c.label}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
