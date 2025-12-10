"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type ProductAnalysis = {
  bankOffers: string[];
  cashbackOffers: string[];
  hasNoCostEmi: boolean;
  suggestedOfferPercent: number | null;
  bestOfferText: string | null;
};

type AvailableCard = {
  issuer: string | null;
  network: string | null;
  label: string | null;
};

export default function NewRequestPage() {
  const router = useRouter();

  const [productLink, setProductLink] = useState("");
  const [productName, setProductName] = useState("");
  const [checkoutPrice, setCheckoutPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const [availableCards, setAvailableCards] = useState<AvailableCard[]>([]);
  const [selectedIssuer, setSelectedIssuer] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [selectedCardLabel, setSelectedCardLabel] = useState<string>("");

  // Load distinct active cards (from SavedCard) for dropdowns
  useEffect(() => {
    const loadCards = async () => {
      try {
        const res = await fetch("/api/buyer/cards/available", {
          cache: "no-store",
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setAvailableCards(data.cards || []);
        } else {
          console.error("Failed to load cards:", data);
        }
      } catch (err) {
        console.error("Available cards error:", err);
      }
    };

    loadCards();
  }, []);

  const issuers = Array.from(
    new Set(
      availableCards
        .map((c) => c.issuer)
        .filter((v): v is string => !!v),
    ),
  );

  const networksForIssuer = Array.from(
    new Set(
      availableCards
        .filter((c) => c.issuer === selectedIssuer)
        .map((c) => c.network)
        .filter((v): v is string => !!v),
    ),
  );

  const labelsForIssuerNet = Array.from(
    new Set(
      availableCards
        .filter((c) => {
          const issuer = (c.issuer || "").trim();
          const network = (c.network || "").trim();
          const selIssuer = selectedIssuer.trim();
          const selNetwork = selectedNetwork.trim();
          return issuer === selIssuer && network === selNetwork;
        })
        .map((c) => c.label)
        .filter((v): v is string => !!v && v.trim().length > 0),
    ),
  );


  // Analyse product link via /api/product/parse
  const handleAnalyseLink = async () => {
    setError(null);
    setParseError(null);
    setAnalysis(null);

    const cleanProductLink = productLink.trim();
    if (!cleanProductLink) {
      setError("Please enter a valid product link.");
      return;
    }

    setIsParsing(true);
    try {
      const res = await fetch("/api/product/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: cleanProductLink }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("Product parse failed:", data);
        setParseError(
          data?.error ||
            "Could not analyse the product link. You can still enter details manually.",
        );
        return;
      }

      // Auto-fill name/price if parser provides them (otherwise user stays manual)
      if (data.productTitle && !productName) {
        setProductName(data.productTitle);
      }
      if (
        data.productPrice != null &&
        data.productPrice !== "" &&
        !checkoutPrice
      ) {
        setCheckoutPrice(String(data.productPrice));
      }

      const parsedAnalysis: ProductAnalysis = {
        bankOffers: data.bankOffers || [],
        cashbackOffers: data.cashbackOffers || [],
        hasNoCostEmi: Boolean(data.hasNoCostEmi),
        suggestedOfferPercent:
          typeof data.suggestedOfferPercent === "number"
            ? data.suggestedOfferPercent
            : null,
        bestOfferText: data.bestOfferText || null,
      };

      setAnalysis(parsedAnalysis);
    } catch (err) {
      console.error("Error calling /api/product/parse:", err);
      setParseError(
        "Something went wrong while analysing the link. You can still enter details manually.",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanProductLink = productLink.trim();
    if (!cleanProductLink) {
      setError("Please enter a valid product link.");
      return;
    }

    if (!productName.trim()) {
      setError("Please enter the product name.");
      return;
    }

    const parsedPrice = Number(checkoutPrice);
    if (!checkoutPrice || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    // Bank and network mandatory; card label is optional
    if (!selectedIssuer || !selectedNetwork) {
      setError("Please select bank and network.");
      return;
    }

    setIsSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          productLink: cleanProductLink,
          productName,
          checkoutPrice: parsedPrice,
          notes,
          requestedIssuer: selectedIssuer,
          requestedNetwork: selectedNetwork,
          requestedCardLabel: selectedCardLabel || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        console.error("Create request failed:", data);
        setError(data?.error || "Something went wrong while creating request.");
        return;
      }

      router.push("/buyer");
    } catch (err) {
      console.error("Error creating request:", err);
      setError("Something went wrong while creating request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // For the "With / Without Runesse" block
  // For the "With / Without Runesse" block
  const numericPrice =
    checkoutPrice && !Number.isNaN(Number(checkoutPrice))
      ? Number(checkoutPrice)
      : null;

  const discountPercent =
    analysis?.suggestedOfferPercent != null
      ? analysis.suggestedOfferPercent
      : null;

  let approxWithRunesse: number | null = null;
  let approxBenefit: number | null = null;

  if (numericPrice != null && discountPercent != null) {
    // Basic percentage benefit
    let calculated = Math.round((numericPrice * discountPercent) / 100);

    // Try to detect "up to ₹X / maximum ₹X / max ₹X" in the offer text
    const offerText = analysis?.bestOfferText || "";
    const capMatch = offerText.match(
      /(upto|up to|maximum|max)\s*₹?\s*([\d,]+)/i
    );

    if (capMatch && capMatch[2]) {
      const capRaw = capMatch[2].replace(/,/g, "");
      const cap = Number(capRaw);
      if (!Number.isNaN(cap) && cap > 0) {
        calculated = Math.min(calculated, cap);
      }
    }

    approxBenefit = calculated;
    approxWithRunesse = numericPrice - approxBenefit;
  }


  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">
            Create a new request
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Paste your product link, choose the card you want to use, and let
            Runesse match you with a cardholder.
          </p>
        </div>
        <Link
          href="/buyer"
          className="text-xs rounded-full border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:border-neutral-500 hover:text-neutral-50"
        >
          ← Back to dashboard
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1.2fr]">
        {/* Left: form */}
        <div className="rounded-2xl border border-neutral-800 bg-black/40 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            {/* Product link + analyse button */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-300">
                Product link<span className="text-red-400">*</span>
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="url"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                  placeholder="Paste Amazon / Flipkart / Myntra link"
                  className="flex-1 rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  required
                />
                <button
                  type="button"
                  onClick={handleAnalyseLink}
                  disabled={isParsing || !productLink}
                  className="whitespace-nowrap rounded-lg border border-neutral-700 px-3 py-2 text-xs font-medium text-neutral-200 hover:border-neutral-500 hover:text-neutral-50 disabled:opacity-60"
                >
                  {isParsing ? "Analysing…" : "Analyse link"}
                </button>
              </div>
              {parseError && (
                <p className="mt-1 text-xs text-red-300">{parseError}</p>
              )}
            </div>

            {/* Product name */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-300">
                Product name<span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="e.g. iQOO 15 5G (12GB, 256GB)"
                required
              />
            </div>

            {/* Price */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-300">
                Checkout price (₹)<span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={checkoutPrice}
                onChange={(e) => setCheckoutPrice(e.target.value)}
                className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="Enter final payable amount"
                required
              />
            </div>

            {/* Card preferences */}
            <div className="mt-4 space-y-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3">
              <h3 className="text-xs font-semibold text-neutral-200">
                Choose the card you want to use
              </h3>
              <p className="text-[11px] text-neutral-500">
                For Phase 1 this is manual. Later Runesse will automatically
                pick the best card based on offers.
              </p>

              {/* Bank / issuer */}
              <div>
                <label className="mb-1 block text-xs text-neutral-300">
                  Bank / Issuer<span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedIssuer}
                  onChange={(e) => {
                    setSelectedIssuer(e.target.value);
                    setSelectedNetwork("");
                    setSelectedCardLabel("");
                  }}
                  className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  required
                >
                  <option value="">Select bank</option>
                  {issuers.map((issuer) => (
                    <option key={issuer} value={issuer}>
                      {issuer}
                    </option>
                  ))}
                </select>
              </div>

              {/* Network */}
              <div>
                <label className="mb-1 block text-xs text-neutral-300">
                  Network (VISA / Mastercard / RuPay)
                  <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => {
                    setSelectedNetwork(e.target.value);
                    setSelectedCardLabel("");
                  }}
                  className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  required
                  disabled={!selectedIssuer}
                >
                  <option value="">Select network</option>
                  {networksForIssuer.map((net) => (
                    <option key={net} value={net}>
                      {net}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card label – optional */}
              <div>
                <label className="mb-1 block text-xs text-neutral-300">
                  Card name / type{" "}
                  <span className="text-neutral-500">(optional)</span>
                </label>
                <select
                  value={selectedCardLabel}
                  onChange={(e) => setSelectedCardLabel(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  disabled={
                    !selectedIssuer || !selectedNetwork || labelsForIssuerNet.length === 0
                  }
                >
                  <option value="">
                    {labelsForIssuerNet.length === 0
                      ? "No specific card names found"
                      : "Select card"}
                  </option>
                  {labelsForIssuerNet.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
                {labelsForIssuerNet.length === 0 && selectedIssuer && selectedNetwork && (
                  <p className="mt-1 text-[11px] text-neutral-500">
                    We don&apos;t have specific card names saved for this bank +
                    network yet. That&apos;s okay – Runesse will still match you
                    based on bank + network.
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-300">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="Any special instructions or constraints?"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => router.push("/buyer")}
                className="text-xs rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-300 hover:border-neutral-500 hover:text-neutral-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs rounded-lg border border-emerald-500/60 bg-emerald-500/20 px-4 py-1.5 font-medium text-emerald-100 hover:border-emerald-400 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating…" : "Create request"}
              </button>
            </div>
          </form>
        </div>

        {/* Right: offer summary */}
        <div className="rounded-2xl border border-neutral-800 bg-black/40 p-4">
          <h2 className="text-sm font-semibold text-neutral-200">
            Offer summary
          </h2>
          <p className="mt-1 text-[11px] text-neutral-500">
            When you analyse the product link, Runesse will try to detect bank
            offers and suggest a rough discount. This is only a helper; the
            final benefit will depend on the actual bank offer at checkout.
          </p>

          {/* With vs without Runesse */}
          {numericPrice != null && discountPercent != null && approxWithRunesse != null && (
            <div className="mt-4 space-y-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
              <div>
                Without Runesse, you would pay{" "}
                <span className="font-semibold">
                  ₹{numericPrice.toLocaleString("en-IN")}
                </span>
                .
              </div>
              <div>
                With Runesse (approx. {discountPercent}% benefit), you may pay
                around{" "}
                <span className="font-semibold">
                  ₹{approxWithRunesse.toLocaleString("en-IN")}
                </span>
                .
              </div>
              {approxBenefit != null && (
                <div>
                  Approx. savings:{" "}
                  <span className="font-semibold">
                    ₹{approxBenefit.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
            </div>
          )}

          {!analysis && (
            <p className="mt-4 text-sm text-neutral-500">
              Analyse a product link to see detected offers here. You can always
              enter name and price manually.
            </p>
          )}

          {analysis && (
            <div className="mt-4 space-y-3 text-sm text-neutral-200">
              {analysis.bestOfferText && (
                <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                  {analysis.bestOfferText}
                </div>
              )}

              {analysis.suggestedOfferPercent !== null && (
                <div className="text-xs text-neutral-300">
                  Approx. discount detected:{" "}
                  <span className="font-semibold">
                    {analysis.suggestedOfferPercent}%
                  </span>
                </div>
              )}

              {analysis.bankOffers.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-neutral-300">
                    Bank offers:
                  </div>
                  <ul className="mt-1 list-disc pl-4 text-[11px] text-neutral-400">
                    {analysis.bankOffers.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.cashbackOffers.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-neutral-300">
                    Cashback offers:
                  </div>
                  <ul className="mt-1 list-disc pl-4 text-[11px] text-neutral-400">
                    {analysis.cashbackOffers.map((o, idx) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-[11px] text-neutral-400">
                No-cost EMI:{" "}
                {analysis.hasNoCostEmi ? (
                  <span className="text-emerald-300">Available</span>
                ) : (
                  <span className="text-neutral-500">Not detected</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
