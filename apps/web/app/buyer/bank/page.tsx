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
};

function statusPillClasses(status?: string) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "VERIFIED") {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
  }
  if (s === "FAILED") {
    return "bg-red-500/10 text-red-300 border border-red-500/40";
  }
  return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
}

export default function BuyerBankPage() {
  const [account, setAccount] = React.useState<BankAccount | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
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
        const res = await fetch("/api/buyer/bank");
        const data = await res.json();

        if (!data?.ok) throw new Error(data?.error || "Failed to load bank");

        if (data.account) {
          setAccount(data.account);
          setForm({
            accountHolderName: data.account.accountHolderName || "",
            accountNumber: data.account.accountNumber || "",
            ifsc: data.account.ifsc || "",
            bankName: data.account.bankName || "",
            branchName: data.account.branchName || "",
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
    value: string
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/buyer/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!data?.ok) throw new Error(data?.error || "Failed to save bank");

      setAccount(data.account);
      setSuccess("Bank details saved. Status is set to Pending for verification.");
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to save bank details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
            Buyer • Bank account
          </p>
          <h1 className="mt-2 text-lg font-semibold">
            Where should refunds go?
          </h1>
          <p className="mt-2 text-xs text-neutral-300">
            Add the bank account where you want refunds for returns/cancellations
            to be credited. In future phases, this will be verified via penny-drop.
          </p>

          {account && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium border bg-black/60">
              <span className={statusPillClasses(account.status)}>
                <span className="px-2 py-0.5 inline-flex rounded-full">
                  {String(account.status || "PENDING").toUpperCase()}
                </span>
              </span>
              <span className="text-neutral-400">
                Current status
              </span>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          {loading ? (
            <p className="text-xs text-neutral-400">Loading bank details...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
              {success && (
                <p className="text-xs text-emerald-400">{success}</p>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-300">
                  Account holder name
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                  value={form.accountHolderName}
                  onChange={(e) => updateField("accountHolderName", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-300">
                  Account number
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                  value={form.accountNumber}
                  onChange={(e) => updateField("accountNumber", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-300">
                  IFSC code
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-1.5 text-xs uppercase outline-none focus:border-emerald-500"
                  value={form.ifsc}
                  onChange={(e) => updateField("ifsc", e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-300">
                  Bank name (optional)
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                  value={form.bankName}
                  onChange={(e) => updateField("bankName", e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-neutral-300">
                  Branch (optional)
                </label>
                <input
                  className="w-full rounded-lg border border-neutral-700 bg-black/60 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                  value={form.branchName}
                  onChange={(e) => updateField("branchName", e.target.value)}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium text-emerald-200 disabled:opacity-50"
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
