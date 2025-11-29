"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";

type Params = {
  id: string;
};

export default function BuyerDepositPage() {
  const params = useParams() as unknown as Params;
  const router = useRouter();
  const requestId = params.id;

  const [amount, setAmount] = React.useState("");
  const [method, setMethod] = React.useState("UPI");
  const [utr, setUtr] = React.useState("");
  const [paidAt, setPaidAt] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!paidAt) {
      setError("Please enter the date/time when you paid.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/buyer/deposits/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          amount: Number(amount),
          currency: "INR",
          method,
          utr: utr || null,
          paidAt,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to record deposit.");
        setSubmitting(false);
        return;
      }

      setSuccess("Deposit recorded successfully in Runesse ledger.");
      setSubmitting(false);

      // Small delay, then go back to request details
      setTimeout(() => {
        router.push(`/buyer/request/${requestId}`);
      }, 1200);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex justify-center px-4 py-10">
      <div className="w-full max-w-xl border border-neutral-800 rounded-2xl bg-neutral-950/80 p-6 space-y-6">
        <button
          type="button"
          onClick={() => router.push(`/buyer/request/${requestId}`)}
          className="text-sm text-neutral-400 hover:text-neutral-100 mb-2"
        >
          ← Back to request
        </button>

        <div>
          <h1 className="text-xl font-semibold">Record deposit to Runesse</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Request ID:{" "}
            <span className="font-mono text-xs text-neutral-300">
              {requestId}
            </span>
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Phase-1 (manual): You have sent money to Runesse&apos;s current
            account. Please enter the details below. Our team will verify the
            deposit and update the status.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm text-neutral-200">
              Amount paid (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="90000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-neutral-200">
              Payment method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            >
              <option value="UPI">UPI</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="IMPS">IMPS</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm text-neutral-200">
              UTR / Reference number (optional)
            </label>
            <input
              type="text"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
              placeholder="Enter bank reference / UPI ID"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-neutral-200">
              When did you pay? (date & time)
            </label>
            <input
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 text-sm font-medium py-2 mt-2"
          >
            {submitting ? "Saving..." : "Save deposit details"}
          </button>
        </form>

        <div className="mt-4 border-t border-neutral-800 pt-3 text-xs text-neutral-500 space-y-1">
          <p>
            Bank details used for this transfer (example – update later to live
            details):
          </p>
          <p>Account name: Runesse</p>
          <p>Account type: Current account</p>
          <p>Bank &amp; branch: (to be updated)</p>
          <p>IFSC: (to be updated)</p>
        </div>
      </div>
    </div>
  );
}
