"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

export default function NewRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const productLink = String(formData.get("productLink") || "").trim();
    const productName = String(formData.get("productName") || "").trim();
    const checkoutPrice = String(formData.get("checkoutPrice") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    // TODO: Replace with session email once auth is complete
    const buyerEmail = "demo-buyer@runesse.local";

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buyerEmail,
          productLink,
          productName,
          checkoutPrice,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data?.error || "Something went wrong while creating the request."
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
    <div className="min-h-screen">

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
          <h1 className="mt-2 text-xl font-semibold text-slate-50">
            Create a new Runesse request.
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Share the product details and your expected price. Card holders with
            matching offers can pick this up. Later we’ll add file uploads and
            automatic verification here.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Product URL */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Product link <span className="text-emerald-400">*</span>
              </label>
              <input
                name="productLink"
                type="url"
                required
                placeholder="https://www.amazon.in/…"
                className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-slate-500">
                Paste the exact URL of the product page (Amazon, Flipkart,
                Myntra, etc.).
              </p>
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
                />
              </div>
            </div>

            {/* Placeholder for future file uploads */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">
                Proofs (coming soon)
              </label>
              <div className="rounded-lg border border-dashed border-neutral-700 bg-black/40 px-3 py-4 text-center text-[11px] text-slate-500">
                File upload for product screenshots will appear here.
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href="/buyer"
                className="text-xs rounded-lg border border-neutral-700 px-3 py-2 text-slate-200 hover:bg-neutral-900 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="text-xs rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-4 py-2 font-medium text-emerald-100 hover:bg-emerald-500/30 transition disabled:opacity-60 disabled:cursor-not-allowed"
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
