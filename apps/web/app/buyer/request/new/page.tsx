"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

type ProductAnalysis = {
  bankOffers: string[];
  cashbackOffers: string[];
  hasNoCostEmi: boolean;
  suggestedOfferPercent: number | null;
  bestOfferText: string | null;
};

export default function NewRequestPage() {
  const router = useRouter();

  const [productLink, setProductLink] = React.useState("");
  const [productName, setProductName] = React.useState("");
  const [checkoutPrice, setCheckoutPrice] = React.useState("");
  const [offerPercent, setOfferPercent] = React.useState<string>(""); // instant benefit %
  const [futureBenefitPercent, setFutureBenefitPercent] =
    React.useState<string>(""); // cashback later %
  const [notes, setNotes] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [isFetchingDetails, setIsFetchingDetails] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<ProductAnalysis | null>(null);

  async function handleFetchFromLink() {
    if (!productLink.trim()) return;

    setIsFetchingDetails(true);
    setFetchError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/product/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: productLink.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        console.error("product/parse error:", data?.error || res.statusText);
        setFetchError(
          data?.error ||
            "We couldn’t read this link. You can still enter details manually."
        );
        return;
      }

      if (data.productName && !productName) {
        setProductName(data.productName);
      }
      if (
        typeof data.price === "number" &&
        !Number.isNaN(data.price) &&
        !checkoutPrice
      ) {
        setCheckoutPrice(String(data.price));
      }

      const detected: ProductAnalysis = {
        bankOffers: Array.isArray(data.bankOffers) ? data.bankOffers : [],
        cashbackOffers: Array.isArray(data.cashbackOffers)
          ? data.cashbackOffers
          : [],
        hasNoCostEmi: Boolean(data.hasNoCostEmi),
        suggestedOfferPercent:
          typeof data.suggestedOfferPercent === "number"
            ? data.suggestedOfferPercent
            : null,
        bestOfferText:
          typeof data.bestOfferText === "string" && data.bestOfferText.trim()
            ? data.bestOfferText.trim()
            : null,
      };
      setAnalysis(detected);

      // Auto-fill offerPercent if empty
      if (
        !offerPercent &&
        detected.suggestedOfferPercent != null &&
        detected.suggestedOfferPercent > 0
      ) {
        setOfferPercent(String(detected.suggestedOfferPercent));
      }

      if (!data.productName && !data.price) {
        setFetchError(
          "Link opened, but we couldn’t confidently read name or price. You can enter them manually."
        );
      } else {
        setFetchError(null);
      }
    } catch (err) {
      console.error("product/parse exception:", err);
      setFetchError(
        "We couldn’t reach the marketplace. Please check the link or try again."
      );
    } finally {
      setIsFetchingDetails(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
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
      setError("Please enter a valid approximate checkout price.");
      return;
    }

    const parsedOfferPercent = offerPercent
      ? Number(offerPercent)
      : undefined;
    const parsedFutureBenefitPercent = futureBenefitPercent
      ? Number(futureBenefitPercent)
      : undefined;

    if (
      offerPercent &&
      (Number.isNaN(parsedOfferPercent) ||
        parsedOfferPercent! < 0 ||
        parsedOfferPercent! > 80)
    ) {
      setError("Please enter a realistic instant offer percentage (0–80%).");
      return;
    }

    if (
      futureBenefitPercent &&
      (Number.isNaN(parsedFutureBenefitPercent) ||
        parsedFutureBenefitPercent! < 0 ||
        parsedFutureBenefitPercent! > 80)
    ) {
      setError(
        "Please enter a realistic future cashback percentage (0–80%)."
      );
      return;
    }

setIsSubmitting(true);

try {
  // Get Supabase session and token
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
      // buyerEmail now comes from the backend via Supabase
      productLink: cleanProductLink,
      productName,
      checkoutPrice,
      notes,
    }),
  });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok || !data.request?.id) {
        console.error("Create request error:", data?.error || res.statusText);
        setError(
          data?.error || "Something went wrong while creating the request."
        );
        setIsSubmitting(false);
        return;
      }

      // Go to the new request details page
      router.push(`/buyer/request/${data.request.id}`);
    } catch (err) {
      console.error("Create request exception:", err);
      setError("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="border-b border-neutral-900 bg-gradient-to-b from-black to-neutral-950/60">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/buyer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-50 hover:border-neutral-600"
                aria-label="Back to buyer dashboard"
              >
                ←
              </Link>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  New request
                </p>
                <h1 className="text-sm sm:text-base font-medium text-neutral-50 truncate">
                  Create a new Runesse request.
                </h1>
                <p className="mt-0.5 text-[11px] text-neutral-500 truncate">
                  Share the product details and your expected price. Card
                  holders with matching offers can pick this up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/70 p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Product link + fetch */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-200">
                Product link <span className="text-red-400">*</span>
              </label>
              <p className="text-[11px] text-neutral-500 mb-1">
                Paste the exact URL of the product page (Amazon, Flipkart,
                Myntra, Ajio, etc.). Runesse will try to auto-fill the name,
                price and best offer from this link.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  className="flex-1 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                  placeholder="https://www.amazon.in/…"
                  value={productLink}
                  onChange={(e) => setProductLink(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleFetchFromLink}
                  disabled={isFetchingDetails || !productLink.trim()}
                  className="mt-1 sm:mt-0 whitespace-nowrap rounded-full border border-emerald-600/70 bg-emerald-600/10 px-3.5 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingDetails ? "Checking link…" : "Fetch details"}
                </button>
              </div>
              {fetchError && (
                <p className="text-[11px] text-red-400 mt-1">{fetchError}</p>
              )}
            </div>

            {/* Product name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Product name
              </label>
              <input
                type="text"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                placeholder="Eg: Apple iPhone 16 Pro Max (256 GB)"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {/* Checkout price */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Approximate checkout price (₹)
              </label>
              <input
                type="number"
                min={1}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                placeholder="Eg: 134900"
                value={checkoutPrice}
                onChange={(e) => setCheckoutPrice(e.target.value)}
              />
              <p className="text-[10px] text-neutral-500">
                Include all charges (product + shipping + taxes) at the final
                checkout page.
              </p>
            </div>

            {/* Offer percentages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">
                  Instant offer % (card / bank offer)
                </label>
                <input
                  type="number"
                  min={0}
                  max={80}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                  placeholder="Eg: 10"
                  value={offerPercent}
                  onChange={(e) => setOfferPercent(e.target.value)}
                />
                <p className="text-[10px] text-neutral-500">
                  If there is a “10% instant discount” on a specific card, enter
                  10 here. We may pre-fill this from the detected best offer.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">
                  Future cashback % (optional)
                </label>
                <input
                  type="number"
                  min={0}
                  max={80}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                  placeholder="Eg: 5"
                  value={futureBenefitPercent}
                  onChange={(e) => setFutureBenefitPercent(e.target.value)}
                />
                <p className="text-[10px] text-neutral-500">
                  Use this if there is an additional cashback that is credited
                  later (for example, after 60–90 days).
                </p>
              </div>
            </div>

            {/* Best offer block */}
            {analysis && (
              <div className="rounded-2xl border border-emerald-700/40 bg-emerald-950/20 px-3.5 py-3 space-y-2">
                <p className="text-[11px] font-medium text-emerald-200">
                  Best offer detected (beta)
                </p>
                <p className="text-[10px] text-emerald-100/80">
                  We scanned the product page for bank offers, EMI and cashback
                  hints. Always double-check on the original site before
                  deciding.
                </p>

                <div className="mt-1 text-[11px] text-neutral-100">
                  {analysis.bestOfferText || analysis.suggestedOfferPercent ? (
                    <>
                      <p className="font-semibold">
                        {analysis.bestOfferText ??
                          `${analysis.suggestedOfferPercent}% offer detected.`}
                      </p>
                      {analysis.suggestedOfferPercent != null && (
                        <p className="text-[10px] text-neutral-300 mt-0.5">
                          Suggested instant offer %:{" "}
                          <span className="font-semibold text-emerald-200">
                            {analysis.suggestedOfferPercent}%
                          </span>{" "}
                          (you can edit the value above).
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-[10px] text-neutral-300">
                      We couldn’t confidently detect a single “best” offer. You
                      can type the numbers manually from the marketplace.
                    </p>
                  )}
                </div>

                {(analysis.bankOffers.length > 0 ||
                  analysis.cashbackOffers.length > 0) && (
                  <details className="mt-2 text-[10px] text-neutral-300">
                    <summary className="cursor-pointer select-none underline underline-offset-2 decoration-emerald-500/70 hover:text-neutral-50">
                      Show all detected offer lines
                    </summary>
                    <ul className="mt-1.5 space-y-1 max-h-28 overflow-y-auto pr-1">
                      {[...analysis.bankOffers, ...analysis.cashbackOffers]
                        .slice(0, 12)
                        .map((line, idx) => (
                          <li key={idx} className="text-[10px] text-neutral-100">
                            • {line}
                          </li>
                        ))}
                    </ul>
                  </details>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Notes for card holder
              </label>
              <textarea
                className="w-full min-h-[70px] rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/70"
                placeholder="Eg: Need delivery before 5 Dec, please keep me updated if the price drops."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-[11px] text-red-400 border border-red-800/60 bg-red-950/40 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[10px] text-neutral-500">
                This is a Phase-1 closed demo. Payments and KYC are handled
                manually by Runesse outside the app.
              </p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs rounded-lg border border-emerald-600/70 bg-emerald-600/10 px-4 py-1.5 font-medium text-emerald-200 hover:bg-emerald-600/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating…" : "Create request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
