"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Params = {
  id: string;
};

export default function AdminPaymentsPage() {
  const params = useParams() as unknown as Params;
  const router = useRouter();
  const requestId = params.id;

  // Deposit confirmation form
  const [depAmount, setDepAmount] = React.useState("");
  const [depUtr, setDepUtr] = React.useState("");
  const [depConfirmedAt, setDepConfirmedAt] = React.useState("");
  const [depSubmitting, setDepSubmitting] = React.useState(false);
  const [depError, setDepError] = React.useState<string | null>(null);
  const [depSuccess, setDepSuccess] = React.useState<string | null>(null);

  // Reimbursement form
  const [remAmount, setRemAmount] = React.useState("");
  const [remMethod, setRemMethod] = React.useState("NEFT");
  const [remUtr, setRemUtr] = React.useState("");
  const [remPaidAt, setRemPaidAt] = React.useState("");
  const [remSubmitting, setRemSubmitting] = React.useState(false);
  const [remError, setRemError] = React.useState<string | null>(null);
  const [remSuccess, setRemSuccess] = React.useState<string | null>(null);

  async function handleConfirmDeposit(e: React.FormEvent) {
    e.preventDefault();
    setDepError(null);
    setDepSuccess(null);

    if (!depAmount || Number(depAmount) <= 0) {
      setDepError("Enter a valid amount.");
      return;
    }

    if (!depConfirmedAt) {
      setDepError("Choose the date/time when deposit was seen.");
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
          currency: "INR",
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

      setDepSuccess("Deposit confirmation recorded in ledger.");
      setDepSubmitting(false);
    } catch (err) {
      console.error(err);
      setDepError("Something went wrong.");
      setDepSubmitting(false);
    }
  }

  async function handleRecordReimbursement(e: React.FormEvent) {
    e.preventDefault();
    setRemError(null);
    setRemSuccess(null);

    if (!remAmount || Number(remAmount) <= 0) {
      setRemError("Enter a valid amount.");
      return;
    }

    if (!remPaidAt) {
      setRemError("Choose the date/time when reimbursement was sent.");
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
          currency: "INR",
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

      setRemSuccess("Reimbursement recorded in ledger.");
      setRemSubmitting(false);
    } catch (err) {
      console.error(err);
      setRemError("Something went wrong.");
      setRemSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <button
          type="button"
          onClick={() => router.push(`/admin/request/${requestId}`)}
          className="text-xs text-neutral-400 hover:text-neutral-100"
        >
          ← Back to request details
        </button>

        <div>
          <h1 className="text-xl font-semibold text-neutral-50">
            Payments for request
          </h1>
          <p className="mt-1 text-xs text-neutral-400">
            Request ID:{" "}
            <span className="font-mono text-[11px] text-neutral-300">
              {requestId}
            </span>
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Use this screen to confirm buyer deposits into Runesse&apos;s
            current account and to record reimbursements to cardholders. All
            actions write ledger entries.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Deposit confirmation */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-medium text-neutral-100">
              Confirm buyer deposit
            </h2>
            <p className="text-[11px] text-neutral-500">
              Use this after you see the buyer&apos;s deposit in Runesse&apos;s
              bank statement.
            </p>

            <form onSubmit={handleConfirmDeposit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-200">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={depAmount}
                  onChange={(e) => setDepAmount(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  placeholder="90000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-200">
                  UTR / reference (optional)
                </label>
                <input
                  type="text"
                  value={depUtr}
                  onChange={(e) => setDepUtr(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  placeholder="Bank / UPI reference"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-200">
                  When did you see the deposit?
                </label>
                <input
                  type="datetime-local"
                  value={depConfirmedAt}
                  onChange={(e) => setDepConfirmedAt(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              {depError && (
                <p className="text-[10px] text-red-300 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                  {depError}
                </p>
              )}
              {depSuccess && (
                <p className="text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">
                  {depSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={depSubmitting}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 text-xs font-medium py-2"
              >
                {depSubmitting ? "Saving…" : "Confirm deposit"}
              </button>
            </form>
          </div>

          {/* Reimbursement */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 sm:p-5 space-y-3">
            <h2 className="text-sm font-medium text-neutral-100">
              Record reimbursement to cardholder
            </h2>
            <p className="text-[11px] text-neutral-500">
              Use this after you send money back to the cardholder&apos;s bank
              account.
            </p>

            <form onSubmit={handleRecordReimbursement} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-200">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={remAmount}
                  onChange={(e) => setRemAmount(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  placeholder="90000"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-200">
                  Method (NEFT / IMPS / UPI / etc.)
                </label>
                <select
                  value={remMethod}
                  onChange={(e) => setRemMethod(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                >
                  <option value="NEFT">NEFT</option>
                  <option value="IMPS">IMPS</option>
                  <option value="UPI">UPI</option>
                  <option value="RTGS">RTGS</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-200">
                  UTR / reference (optional)
                </label>
                <input
                  type="text"
                  value={remUtr}
                  onChange={(e) => setRemUtr(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                  placeholder="Bank / UPI reference"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-200">
                  When did you pay the cardholder?
                </label>
                <input
                  type="datetime-local"
                  value={remPaidAt}
                  onChange={(e) => setRemPaidAt(e.target.value)}
                  className="w-full rounded-lg bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              {remError && (
                <p className="text-[10px] text-red-300 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                  {remError}
                </p>
              )}
              {remSuccess && (
                <p className="text-[10px] text-emerald-300 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">
                  {remSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={remSubmitting}
                className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-700 text-xs font-medium py-2"
              >
                {remSubmitting ? "Saving…" : "Record reimbursement"}
              </button>
            </form>
          </div>
        </div>

        <p className="text-[11px] text-neutral-500">
          All actions on this screen are logged in the ledger and visible on the
          audit trail in the request details page.
        </p>
      </div>
    </div>
  );
}
