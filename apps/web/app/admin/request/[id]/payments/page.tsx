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

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">
          Checking admin device trust…
        </p>
      </div>
    );
  }

  const params = useParams() as unknown as Params;
  const router = useRouter();
  const requestId = params.id;

  // Deposit confirmation form
  const [depAmount, setDepAmount] = React.useState("");
  const [depUtr, setDepUtr] = React.useState("");
  const [depConfirmedAt, setDepConfirmedAt] = React.useState("");
  const [depError, setDepError] = React.useState<string | null>(null);
  const [depSuccess, setDepSuccess] = React.useState<string | null>(null);
  const [depSubmitting, setDepSubmitting] = React.useState(false);

  // Reimbursement record form
  const [remAmount, setRemAmount] = React.useState("");
  const [remMethod, setRemMethod] = React.useState("UPI");
  const [remUtr, setRemUtr] = React.useState("");
  const [remPaidAt, setRemPaidAt] = React.useState("");
  const [remError, setRemError] = React.useState<string | null>(null);
  const [remSuccess, setRemSuccess] = React.useState<string | null>(null);
  const [remSubmitting, setRemSubmitting] = React.useState(false);

  async function handleConfirmDeposit(e: React.FormEvent) {
    e.preventDefault();
    setDepError(null);
    setDepSuccess(null);

    if (!requestId) {
      setDepError("Missing request id.");
      return;
    }

    if (!depAmount || Number(depAmount) <= 0) {
      setDepError("Enter a valid deposit amount.");
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
    } catch (err: any) {
      console.error("Deposit confirm error", err);
      setDepError(err?.message || "Unexpected error confirming deposit.");
      setDepSubmitting(false);
    }
  }

  async function handleRecordReimbursement(e: React.FormEvent) {
    e.preventDefault();
    setRemError(null);
    setRemSuccess(null);

    if (!requestId) {
      setRemError("Missing request id.");
      return;
    }

    if (!remAmount || Number(remAmount) <= 0) {
      setRemError("Enter a valid reimbursement amount.");
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
    } catch (err: any) {
      console.error("Reimbursement record error", err);
      setRemError(err?.message || "Unexpected error recording reimbursement.");
      setRemSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-500 mb-0.5">
              <Link
                href="/admin/requests"
                className="text-neutral-400 hover:text-neutral-100 hover:underline underline-offset-4"
              >
                Requests
              </Link>{" "}
              <span className="mx-1">/</span>
              <Link
                href={`/admin/request/${requestId}`}
                className="text-neutral-400 hover:text-neutral-100 hover:underline underline-offset-4"
              >
                {requestId}
              </Link>{" "}
              <span className="mx-1">/</span>
              <span className="text-neutral-500">Payments</span>
            </p>
            <h1 className="text-sm font-semibold text-neutral-50">
              Payments & settlement
            </h1>
          </div>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 hover:border-neutral-600"
          >
            Back
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-4 space-y-4">
        {/* Deposit confirmation */}
        <section className="rounded-2xl border border-neutral-900 bg-neutral-950/80 p-4">
          <h2 className="text-xs font-semibold text-neutral-50 mb-1">
            Buyer deposit confirmation
          </h2>
          <p className="text-[11px] text-neutral-500 mb-3">
            Confirm that the buyer&apos;s deposit has reached Runesse&apos;s
            current account (Phase-1 manual flow).
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
              <label className="block text-neutral-400">Amount received</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={depAmount}
                onChange={(e) => setDepAmount(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="e.g. 10000"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-neutral-400">UTR / reference</label>
              <input
                type="text"
                value={depUtr}
                onChange={(e) => setDepUtr(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="Optional UTR / reference"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="block text-neutral-400">
                Deposit seen in bank at
              </label>
              <input
                type="datetime-local"
                value={depConfirmedAt}
                onChange={(e) => setDepConfirmedAt(e.target.value)}
                className="w-full md:w-1/2 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between mt-1">
              <p className="text-[10px] text-neutral-500">
                This will create a <strong>BUYER_DEPOSIT_CONFIRMED</strong>{" "}
                style ledger entry for this request.
              </p>
              <button
                type="submit"
                disabled={depSubmitting}
                className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {depSubmitting ? "Confirming…" : "Confirm deposit"}
              </button>
            </div>
          </form>
        </section>

        {/* Reimbursement record */}
        <section className="rounded-2xl border border-neutral-900 bg-neutral-950/80 p-4">
          <h2 className="text-xs font-semibold text-neutral-50 mb-1">
            Cardholder reimbursement
          </h2>
          <p className="text-[11px] text-neutral-500 mb-3">
            Record the amount reimbursed to the cardholder from Runesse&apos;s
            account. This links the payout to the buyer&apos;s deposit in the
            ledger.
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
                Reimbursement amount
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={remAmount}
                onChange={(e) => setRemAmount(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                placeholder="e.g. 9500"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-neutral-400">Method</label>
              <select
                value={remMethod}
                onChange={(e) => setRemMethod(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
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
                UTR / payout reference
              </label>
              <input
                type="text"
                value={remUtr}
                onChange={(e) => setRemUtr(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
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
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between mt-1">
              <p className="text-[10px] text-neutral-500">
                This will create a{" "}
                <strong>CARDHOLDER_REIMBURSEMENT_CREATED</strong> style ledger
                entry for this request.
              </p>
              <button
                type="submit"
                disabled={remSubmitting}
                className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {remSubmitting ? "Recording…" : "Record reimbursement"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
