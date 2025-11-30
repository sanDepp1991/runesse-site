"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

export default function NewRequestPage() {
  const router = useRouter();

  const [productLink, setProductLink] = React.useState("");
  const [productName, setProductName] = React.useState("");
  const [checkoutPrice, setCheckoutPrice] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [isFetchingDetails, setIsFetchingDetails] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // 🔍 Call backend to analyse product URL
  async function handleFetchFromLink() {
    setFetchError(null);
    setError(null);

    const url = productLink.trim();
    if (!url) {
      setFetchError("Please paste a product link first.");
      return;
    }

    setIsFetchingDetails(true);
    try {
      const res = await fetch("/api/product/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Could not read product details.");
      }

      // Only overwrite if backend returns something
      if (data.productName && !productName) {
        setProductName(String(data.productName));
      }
      if (
        typeof data.price === "number" &&
        !Number.isNaN(data.price) &&
        !checkoutPrice
      ) {
        setCheckoutPrice(String(data.price));
      }

      if (!data.productName && !data.price) {
        setFetchError(
          "Link opened, but we couldn't confidently read name or price. You can enter them manually."
        );
      } else {
        setFetchError(null);
      }
  } catch (err: any) {
    console.warn(err);
    setFetchError(
      err?.message ||
        "Something went wrong while checking the product link."
    );
  } finally {
      setIsFetchingDetails(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const cleanProductLink = productLink.trim();
    if (!cleanProductLink) {
      setError("Product link is required.");
      return;
    }

    setIsSubmitting(true);

    // Phase-1 demo buyer identity
    const buyerEmail = "buyer@demo.runesse";

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buyerEmail,
          productLink: cleanProductLink,
          productName: productName.trim() || null,
          checkoutPrice: checkoutPrice.trim(),
          notes: notes.trim(),
        }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || data?.error) {
        setError(
          data?.message ||
            data?.error ||
            "Something went wrong while creating the request."
        );
        setIsSubmitting(false);
        return;
      }

      // Success – go back to Buyer home
      router.push("/buyer");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Breadcrumb + back */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            <Link href="/buyer" className="hover:underline">
              Buyer
            </Link>{" "}
            / <span className="text-slate-200">New request</span>
          </div>

          <Link
            href="/buyer"
            className="text-xs rounded-full border border-neutral-700 px-3 py-1 text-slate-200 hover:bg-neutral-900 transition"
          >
            ← Back to Buyer home
          </Link>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
            New request
          </p>
          <h1 className="mt-2 text-xl font-semibold">
            Create a new Runesse request.
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Share the product details and your expected price. Card holders with
            matching offers can pick this up. Later we&apos;ll add file uploads
            and automatic verification here.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Product URL */}
            <div className="space-y-2">
              <div className="flex items-end justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-slate-200">
                    Product link{" "}
                    <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    name="productLink"
                    type="url"
                    required
                    placeholder="https://www.amazon.in/…"
                    className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500">
                    Paste the exact URL of the product page (Amazon, Flipkart,
                    Myntra, Ajio, etc.). Runesse will try to auto-fill the name
                    and price from this link.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleFetchFromLink}
                  disabled={isFetchingDetails || !productLink.trim()}
                  className="mt-5 whitespace-nowrap rounded-full border border-emerald-500/70 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingDetails ? "Checking link…" : "Fetch details"}
                </button>
              </div>

              {fetchError && (
                <p className="text-[11px] text-red-400">{fetchError}</p>
              )}
            </div>

            {/* Product name */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Product name
              </label>
              <input
                name="productName"
                type="text"
                placeholder='Sony Bravia 55" 4K TV'
                className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            {/* Price + Notes */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">
                  Approximate checkout price (₹)
                </label>
                <input
                  name="checkoutPrice"
                  type="number"
                  min={0}
                  step="1"
                  placeholder="45000"
                  className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  value={checkoutPrice}
                  onChange={(e) => setCheckoutPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">
                  Notes for card holder
                </label>
                <input
                  name="notes"
                  type="text"
                  placeholder="Eg: Need delivery before 25th"
                  className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs rounded-lg border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 font-medium text-emerald-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
