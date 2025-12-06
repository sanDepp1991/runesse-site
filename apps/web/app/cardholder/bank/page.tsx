"use client";

import React from "react";

type BankAccount = {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  bankName?: string | null;
  branchName?: string | null;
  status: "PENDING" | "VERIFIED" | "FAILED" | string;
  verificationMethod?: string | null;
  lastVerifiedAt?: string | null;
};

function statusPillClasses(status?: string) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "VERIFIED") {
    return "bg-sky-500/10 text-sky-300 border border-sky-500/40";
  }
  if (s === "FAILED") {
    return "bg-red-500/10 text-red-300 border border-red-500/40";
  }
  return "bg-yellow-500/10 text-yellow-200 border border-yellow-500/40";
}

export default function CardholderBankPage() {
  const [account, setAccount] = React.useState<BankAccount | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    branchName: "",
  });

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/cardholder/bank");
        const data = await res.json();

        if (!data?.ok)
          throw new Error(data?.error || "Failed to load bank details");

        if (data.account) {
          const a = data.account as BankAccount;
          setAccount(a);
          setForm({
            accountHolderName: a.accountHolderName || "",
            accountNumber: a.accountNumber || "",
            ifsc: a.ifsc || "",
            bankName: a.bankName || "",
            branchName: a.branchName || "",
          });
        }
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Failed to load bank details");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function updateField(
    key: keyof typeof form,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/cardholder/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || "Failed to save bank");

      setAccount(data.account as BankAccount);
      setSuccess(
        "Bank details saved. Status is set to Pending for verification.",
      );
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to save bank details");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    if (!account) return;

    setVerifying(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/cardholder/bank/verify", {
        method: "POST",
      });

      const data = await res.json();
      if (!data?.ok) {
        setError(data?.error || "Verification failed");
      } else if (data.account) {
        setAccount(data.account as BankAccount);
        setSuccess("Bank account verified successfully.");
      }
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Verification failed due to a network error.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-400">
            Cardholder • Bank account
          </p>
          <h1 className="mt-2 text-lg font-semibold">
            Where should reimbursements go?
          </h1>
          <p className="mt-2 text-xs text-neutral-300">
            Add the bank account where you want Runesse to reimburse you after
            admin verifies your invoice and card proof. In future phases, this
            will be verified via penny-drop.
          </p>

          {account && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-full border border-neutral-700 bg-black/60 px-3 py-1 text-[11px]">
              <div className="flex items-center gap-2">
                <span className={statusPillClasses(account.status)}>
                  <span className="px-2 py-0.5 inline-flex rounded-full">
                    {String(account.status || "PENDING").toUpperCase()}
                  </span>
                </span>
                <span className="text-neutral-400">
                  {account.status === "VERIFIED"
                    ? "Verified bank account"
                    : "Bank verification pending"}
                </span>
                {account.verificationMethod && (
                  <span className="text-[10px] text-neutral-500">
                    via{" "}
                    {account.verificationMethod === "PENNY_DROP"
                      ? "penny-drop (simulated)"
                      : account.verificationMethod}
                  </span>
                )}
              </div>
              {account.status === "PENDING" && (
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifying}
                  className="rounded-full border border-sky-500/60 px-3 py-1.5 text-[11px] font-medium text-sky-200 disabled:opacity-50"
                >
                  {verifying ? "Verifying…" : "Verify now"}
                </button>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
          <h2 className="text-sm font-semibold">Bank account details</h2>
          <p className="mt-1 text-xs text-neutral-400">
            You can update these details at any time. Editing will reset the
            status to Pending until verification is done again.
          </p>

          {loading ? (
            <p className="mt-4 text-xs text-neutral-500">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              {error && (
                <div className="rounded-md border border-red-500/40 bg-red-950/40 px-3 py-2 text-[11px] text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md border border-sky-500/40 bg-sky-950/40 px-3 py-2 text-[11px] text-sky-200">
                  {success}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-neutral-300">
                  Account holder name
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-sky-500"
                  value={form.accountHolderName}
                  onChange={(e) =>
                    updateField("accountHolderName", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-300">
                  Account number
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-sky-500"
                  value={form.accountNumber}
                  onChange={(e) =>
                    updateField("accountNumber", e.target.value)
                  }
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-300">IFSC</label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-1.5 text-xs uppercase outline-none focus:border-sky-500"
                  value={form.ifsc}
                  onChange={(e) => updateField("ifsc", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-300">Bank name</label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-sky-500"
                  value={form.bankName}
                  onChange={(e) => updateField("bankName", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-300">Branch name</label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-sky-500"
                  value={form.branchName}
                  onChange={(e) => updateField("branchName", e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full border border-sky-500/70 bg-sky-500/10 px-4 py-1.5 text-xs font-medium text-sky-200 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save bank details"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
