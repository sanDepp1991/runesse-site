"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRoleAccess } from "../../../lib/roleAccess";

type SavedCard = {
  id: string;
  bin: string;
  last4: string;
  issuer: string | null;
  network: string | null;
  brand: string | null;
  country: string | null;
  label: string | null;
};

async function getBearerToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export default function CardholderCardsPage() {
  useRoleAccess();

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bin, setBin] = useState("");
  const [last4, setLast4] = useState("");
  const [issuer, setIssuer] = useState("");
  const [network, setNetwork] = useState("");
  const [brand, setBrand] = useState("");
  const [country, setCountry] = useState("");
  const [label, setLabel] = useState("");

  const [binHint, setBinHint] = useState<string | null>(null);
  const lastLookedUpBin = useRef<string>("");

  /* ---------------- Load cards ---------------- */

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getBearerToken();
      if (!token) return;

      const res = await fetch("/api/cardholder/cards", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setCards(data.cards || []);
    } catch {
      setError("Failed to load cards");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  /* ---------------- BIN lookup ---------------- */

  const lookupBin = async (sixDigitBin: string) => {
    setBinHint("Fetching card details…");

    try {
      const res = await fetch("/api/bin-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bin: sixDigitBin }),
      });

      const data = await res.json();

      if (data?.ok) {
        if (!issuer && data.issuer) setIssuer(data.issuer);
        if (!network && data.network) setNetwork(data.network);
        if (data.brand) setBrand(data.brand);
        if (data.country) setCountry(data.country);
        setBinHint("Card details detected");
      } else {
        setBinHint(null);
      }
    } catch {
      setBinHint(null);
    } finally {
      setTimeout(() => setBinHint(null), 2500);
    }
  };

  const handleBinChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setBin(digits);

    if (digits.length < 6) {
      lastLookedUpBin.current = "";
      setBinHint(null);
      return;
    }

    if (digits.length === 6 && lastLookedUpBin.current !== digits) {
      lastLookedUpBin.current = digits;
      lookupBin(digits);
    }
  };

  /* ---------------- Save card ---------------- */

  const canSubmit = /^\d{6}$/.test(bin) && /^\d{4}$/.test(last4);

  async function onAddCard(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError(null);

    try {
      const token = await getBearerToken();
      if (!token) return;

      const res = await fetch("/api/cardholder/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bin,
          last4,
          issuer: issuer || null,
          network: network || null,
          brand: brand || null,
          country: country || null,
          label: label || null,
        }),
      });

      if (!res.ok) {
        setError("Failed to save card");
        return;
      }

      setBin("");
      setLast4("");
      setIssuer("");
      setNetwork("");
      setBrand("");
      setCountry("");
      setLabel("");
      lastLookedUpBin.current = "";

      await loadCards();
    } catch {
      setError("Failed to save card");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-semibold text-neutral-100 mb-4">
        Saved Cards
      </h1>

      <form onSubmit={onAddCard} className="space-y-4">
        <div>
          <label className="text-sm text-neutral-300">BIN (6 digits)</label>
          <input
            value={bin}
            onChange={(e) => handleBinChange(e.target.value)}
            inputMode="numeric"
            className="w-full mt-1 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-neutral-100"
            placeholder="e.g. 411111"
          />
          {binHint && (
            <div className="mt-1 text-xs text-neutral-400">{binHint}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-neutral-300">Last 4 digits</label>
          <input
            value={last4}
            onChange={(e) =>
              setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
            }
            inputMode="numeric"
            className="w-full mt-1 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-neutral-100"
            placeholder="e.g. 1234"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Issuer"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-neutral-100"
          />
          <input
            placeholder="Network"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-neutral-100"
          />
        </div>

        <input
          placeholder="Label (optional)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-neutral-100"
        />

        {error && (
          <div className="text-sm text-red-400 border border-red-800 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="rounded-xl bg-neutral-100 text-neutral-900 px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save card"}
        </button>
      </form>

      <div className="mt-8">
        <h2 className="text-lg text-neutral-200 mb-3">Your cards</h2>
        {loading ? (
          <div className="text-neutral-400">Loading…</div>
        ) : cards.length === 0 ? (
          <div className="text-neutral-400">No cards saved yet.</div>
        ) : (
          <div className="space-y-3">
            {cards.map((c) => (
              <div
                key={c.id}
                className="border border-neutral-800 rounded-xl px-4 py-3 bg-neutral-900"
              >
                <div className="text-neutral-100 font-medium">
                  {c.issuer || "Issuer"} • {c.network || "Network"}
                </div>
                <div className="text-sm text-neutral-400">
                  BIN {c.bin} • **** {c.last4}
                </div>
                {c.label && (
                  <div className="text-sm text-neutral-500">{c.label}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
