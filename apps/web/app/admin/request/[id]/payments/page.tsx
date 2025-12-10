"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminDeviceGuard } from "../../../useAdminDeviceGuard";

type Params = {
  id: string;
};

export default function AdminPaymentsPage() {
  const { checking } = useAdminDeviceGuard();
  const params = useParams() as unknown as Params;
  const router = useRouter();
  const requestId = params.id;

  // Buyer deposit confirmation state
  const [depAmount, setDepAmount] = React.useState("");
  const [depCurrency] = React.useState("INR");
  const [depUtr, setDepUtr] = React.useState("");
  const [depConfirmedAt, setDepConfirmedAt] = React.useState(
    () => new Date().toISOString().slice(0, 16)
  );
  const [depSubmitting, setDepSubmitting] = React.useState(false);
  const [depError, setDepError] = React.useState<string | null>(null);
  const [depSuccess, setDepSuccess] = React.useState<string | null>(null);

  // Cardholder reimbursement state
  const [remAmount, setRemAmount] = React.useState("");
  const [remCurrency] = React.useState("INR");
  const [remMethod, setRemMethod] = React.useState("UPI");
  const [remUtr, setRemUtr] = React.useState("");
  const [remPaidAt, setRemPaidAt] = React.useState(
    () => new Date().toISOString().slice(0, 16)
  );
  const [remSubmitting, setRemSubmitting] = React.useState(false);
  const [remError, setRemError] = React.useState<string | null>(null);
  const [remSuccess, setRemSuccess] = React.useState<string | null>(null);

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">
          Checking admin device trust…
        </p>
      </div>
    );
  }

  async function handleConfirmDeposit(e: React.FormEvent) {
    e.preventDefault();
    setDepError(null);
    setDepSuccess(null);

    if (!depAmount || Number(depAmount) <= 0) {
      setDepError("Enter a valid amount received.");
      return;
    }

    if (!depConfirmedAt) {
      setDepError("Select when the deposit was confirmed.");
      return;
    }

    setDepSubmitting(true);
    try {
      const res = await fetch("/api/admin/deposits/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          amount: Number(depAmount),
          currency: depCurrency,
          utr: depUtr || null,
          confirmedAt: depConfirmedAt,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setDepError(data?.error || "Failed to confirm deposit.");
        setDepSubmitting(false);
        return;
      }

      setDepSuccess("Buyer deposit confirmation recorded in the ledger.");
      setDepSubmitting(false);
    } catch (err) {
      console.error(err);
      setDepError("Something went wrong. Please try again.");
      setDepSubmitting(false);
    }
  }

  async function handleRecordReimbursement(e: React.FormEvent) {
    e.preventDefault();
    setRemError(null);
    setRemSuccess(null);

    if (!remAmount || Number(remAmount) <= 0) {
      setRemError("Enter a valid reimbursement amount.");
      return;
    }

    if (!remPaidAt) {
      setRemError("Select when reimbursement was sent.");
      return;
    }

    setRemSubmitting(true);
    try {
      const res = await fetch("/api/admin/reimbursements/record", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          amount: Number(remAmount),
          currency: remCurrency,
          method: remMethod,
          utr: remUtr || null,
          paidAt: remPaidAt,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setRemError(data?.error || "Failed to record reimbursement.");
        setRemSubmitting(false);
        return;
      }

      setRemSuccess("Cardholder reimbursement recorded in the ledger.");
      setRemSubmitting(false);
    } catch (err) {
      console.error(err);
      setRemError("Something went wrong. Please try again.");
      setRemSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex justify-center px-4 py-8">
      <main className="w-full max-w-4xl border border-neutral-800 rounded-2xl bg-neutral-950/80 p-6 space-y-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-neutral-500">
              Admin · Payments
            </p>
            <h1 className="text-lg font-semibold text-neutral-100">
              Buyer deposit &amp; cardholder reimbursement
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Request ID:{" "}
              <span className="font-mono text-[11px] text-neutral-300">
                {requestId}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/request/${requestId}`}
              className="text-xs text-neutral-400 hover:text-neutral-100"
            >
              ← Back to request
            </Link>
            <Link
              href={`/admin/request/${requestId}/ledger`}
              className="text-xs text-emerald-400 hover:text-emerald-300"
            >
              View ledger
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Buyer deposit confirmation */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-100">
              Confirm buyer deposit
            </h2>
            <p className="text-[11px] text-neutral-500">
              Use this after you see the buyer&apos;s deposit in Runesse&apos;s
              current account. This will write a{" "}
              <strong>BUYER_DEPOSIT_CONFIRMED</strong> style ledger entry.
            </p>

            {depError && (
              <div className="mb-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                {depError}
              </div>
            )}
            {depSuccess && (
              <div className="mb-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
                {depSuccess}
              </div>
            )}

            <form
              onSubmit={handleConfirmDeposit}
              className="grid gap-3 md:grid-cols-2 text-[11px]"
            >
              <div className="space-y-1">
                <label className="block text-neutral-400">
                  Amount received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="e.g. 90000"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-neutral-400">Currency</label>
                <input
                  type="text"
                  value={depCurrency}
                  disabled
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400">
                  UTR / Reference (optional)
                </label>
                <input
                  type="text"
                  value={depUtr}
                  onChange={(e) => setDepUtr(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="Optional UTR / reference"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-neutral-400">
                  Deposit confirmed at
                </label>
                <input
                  type="datetime-local"
                  value={depConfirmedAt}
                  onChange={(e) => setDepConfirmedAt(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between mt-1">
                <p className="text-[10px] text-neutral-500">
                  This only records confirmation in the ledger. Actual money
                  stays in the current account.
                </p>
                <button
                  type="submit"
                  disabled={depSubmitting}
                  className="rounded-lg border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {depSubmitting ? "Confirming…" : "Confirm deposit"}
                </button>
              </div>
            </form>
          </section>

          {/* Cardholder reimbursement recording */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
            <h2 className="text-sm font-semibold text-neutral-100">
              Record cardholder reimbursement
            </h2>
            <p className="text-[11px] text-neutral-500">
              After you reimburse the cardholder outside the app, record the
              details here. This will create a{" "}
              <strong>CARDHOLDER_REIMBURSEMENT_CREATED</strong> style ledger
              entry.
            </p>

            {remError && (
              <div className="mb-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                {remError}
              </div>
            )}
            {remSuccess && (
              <div className="mb-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
                {remSuccess}
              </div>
            )}

            <form
              onSubmit={handleRecordReimbursement}
              className="grid gap-3 md:grid-cols-2 text-[11px]"
            >
              <div className="space-y-1">
                <label className="block text-neutral-400">
                  Amount reimbursed (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={remAmount}
                  onChange={(e) => setRemAmount(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="e.g. 90000"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-neutral-400">Currency</label>
                <input
                  type="text"
                  value={remCurrency}
                  disabled
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-neutral-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400">Method</label>
                <select
                  value={remMethod}
                  onChange={(e) => setRemMethod(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                >
                  <option value="UPI">UPI</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="IMPS">IMPS</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400">
                  UTR / Reference (optional)
                </label>
                <input
                  type="text"
                  value={remUtr}
                  onChange={(e) => setRemUtr(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  placeholder="Optional UTR / reference"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-400">
                  Reimbursement sent at
                </label>
                <input
                  type="datetime-local"
                  value={remPaidAt}
                  onChange={(e) => setRemPaidAt(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-between mt-1">
                <p className="text-[10px] text-neutral-500">
                  This does not move money. It only records what you already
                  paid to the cardholder.
                </p>
                <button
                  type="submit"
                  disabled={remSubmitting}
                  className="rounded-lg border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {remSubmitting ? "Recording…" : "Record reimbursement"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}
