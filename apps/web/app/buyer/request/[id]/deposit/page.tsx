"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { RUNESSE_RECEIVING_ACCOUNT } from "@/config/runesseAccount";

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
  const [paidAt, setPaidAt] = React.useState(
    () => new Date().toISOString().slice(0, 16)
  );
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
      setError("Please enter the date and time of payment.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/buyer/deposits/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          amount: Number(amount),
          currency: "INR",
          method,
          utr: utr || null,
          paidAt,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setError(data?.error || "Failed to save deposit details.");
        setSubmitting(false);
        return;
      }

      setSuccess("Deposit recorded successfully. Runesse will verify shortly.");
      setSubmitting(false);

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
      <div className="w-full max-w-5xl border border-neutral-800 rounded-2xl bg-neutral-950/80 p-6 space-y-6">
        <button
          type="button"
          onClick={() => router.push(`/buyer/request/${requestId}`)}
          className="text-sm text-neutral-400 hover:text-neutral-100"
        >
          ← Back to request
        </button>

        <div>
          <h1 className="text-xl font-semibold">Pay & record deposit</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Request ID:{" "}
            <span className="font-mono text-neutral-300">{requestId}</span>
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Phase-1 (manual): First pay to Runesse’s current account. Then submit
            payment details for verification.
          </p>
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-6 md:grid-cols-[2fr_2.2fr]">
          {/* LEFT – PAY NOW */}
          <div className="border border-neutral-800 rounded-2xl bg-neutral-900/40 p-4 space-y-4 text-center">
            <p className="text-[11px] uppercase tracking-wide text-emerald-400">
              Step 1 · Pay now
            </p>

            <h2 className="text-sm font-medium">
              Scan & pay to Runesse current account
            </h2>

            <div className="flex justify-center">
              <div className="rounded-xl bg-black/70 border border-neutral-800 p-3">
                <img
                  src="/runesse-current-account-upi-qr.png"
                  alt="Runesse current account UPI QR"
                  className="w-44 h-44 object-contain"
                />
              </div>
            </div>

            <div className="text-xs text-neutral-400 space-y-1">
              <p><b>Account name:</b> {RUNESSE_RECEIVING_ACCOUNT.accountName}</p>
              <p><b>Account type:</b> {RUNESSE_RECEIVING_ACCOUNT.accountType}</p>
              <p>
                <b>Bank:</b>{" "}
                {RUNESSE_RECEIVING_ACCOUNT.bankName},{" "}
                {RUNESSE_RECEIVING_ACCOUNT.branchName}
              </p>
              <p><b>Account no:</b> {RUNESSE_RECEIVING_ACCOUNT.accountNumber}</p>
              <p><b>IFSC:</b> {RUNESSE_RECEIVING_ACCOUNT.ifsc}</p>
            </div>

            <p className="text-[11px] text-neutral-500 pt-2">
              {RUNESSE_RECEIVING_ACCOUNT.note}
            </p>
          </div>

          {/* RIGHT – FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-neutral-200">
                Amount paid (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
                placeholder="e.g. 90000"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-200">
                Payment method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
              >
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-neutral-200">
                UTR / Reference number (optional)
              </label>
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-200">
                Date & time of payment
              </label>
              <input
                type="datetime-local"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="mt-1 w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {success && (
              <div className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 py-2 text-sm font-medium transition"
            >
              {submitting ? "Saving..." : "Save deposit details"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
