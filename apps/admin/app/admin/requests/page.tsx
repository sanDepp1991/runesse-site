"use client";

import React from "react";
import Link from "next/link";
import { useAdminDeviceGuard } from "../useAdminDeviceGuard";

type RequestStatus =
  | "SUBMITTED"
  | "ADMIN_APPROVED"
  | "MATCHED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | string;

type FilterKey = "all" | "submitted" | "approved" | "matched" | "closed";

interface RequestItem {
  id: string;
  productName?: string | null;
  productLink?: string | null;
  checkoutPrice?: number | null;
  status?: RequestStatus;
  createdAt?: string | null;
  matchedAt?: string | null;
  completedAt?: string | null;
  buyerEmail?: string | null;
  matchedCardholderEmail?: string | null;
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const raw = (status || "SUBMITTED").toUpperCase();

  let border = "border-neutral-700";
  let bg = "bg-neutral-900/80";
  let text = "text-neutral-100";

  if (raw === "SUBMITTED") {
    border = "border-amber-500/40";
    bg = "bg-amber-500/10";
    text = "text-amber-300";
  } else if (raw === "ADMIN_APPROVED") {
    border = "border-sky-500/40";
    bg = "bg-sky-500/10";
    text = "text-sky-300";
  } else if (raw === "MATCHED") {
    border = "border-indigo-500/40";
    bg = "bg-indigo-500/10";
    text = "text-indigo-300";
  } else if (raw === "COMPLETED") {
    border = "border-emerald-500/40";
    bg = "bg-emerald-500/10";
    text = "text-emerald-300";
  } else if (raw === "CANCELLED" || raw === "REJECTED") {
    border = "border-red-500/40";
    bg = "bg-red-500/10";
    text = "text-red-300";
  }

  const display =
    raw === "SUBMITTED"
      ? "Submitted"
      : raw === "ADMIN_APPROVED"
      ? "Approved"
      : raw === "CANCELLED"
      ? "Cancelled"
      : raw === "REJECTED"
      ? "Rejected"
      : raw;

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium",
        border,
        bg,
        text,
      ].join(" ")}
    >
      {display}
    </span>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminRequestsPage() {
  const { checking, allowed } = useAdminDeviceGuard();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RequestItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<FilterKey>("all");

  React.useEffect(() => {
    if (!allowed) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/admin/requests/list", {
          method: "GET",
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          setError(data?.error || "Failed to load requests.");
          setItems([]);
          setLoading(false);
          return;
        }

        setItems(data.requests || []);
        setLoading(false);
      } catch (e: any) {
        console.error("[AdminRequestsPage] load error", e);
        setError(e?.message || "Unexpected error");
        setItems([]);
        setLoading(false);
      }
    }

    load();
  }, [allowed]);

    const applyFilter = (rows: RequestItem[]): RequestItem[] => {
    if (filter === "all") return rows;
    return rows.filter((r) => {
      const s = (r.status || "SUBMITTED").toUpperCase();
      if (filter === "submitted") return s === "SUBMITTED";
      if (filter === "approved") return s === "ADMIN_APPROVED";
      if (filter === "matched") return s === "MATCHED";
      if (filter === "closed")
        return s === "COMPLETED" || s === "CANCELLED" || s === "REJECTED";
      return true;
    });
  };

  const filtered = applyFilter(items);

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">
          Checking admin device trust…
        </p>
      </div>
    );
  }

  // No explicit `if (!allowed)` block here.
  // If not allowed, the guard will already have redirected.

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-neutral-100">
                Requests
              </h1>
              <p className="text-xs text-neutral-500">
                Monitor and drill into buyer / cardholder requests.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-1.5 text-xs text-neutral-100 hover:border-neutral-600"
            >
              Admin overview
            </Link>
            <Link
              href="/admin/ledger"
              className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-3 py-1.5 text-xs text-neutral-100 hover:border-neutral-600"
            >
              Ledger
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-950/80 px-1 py-1">
            {(
              [
                ["all", "All"],
                ["submitted", "Submitted"],
                ["approved", "Approved"],
                ["matched", "Matched"],
                ["closed", "Closed"],
              ] as [FilterKey, string][]
            ).map(([key, label]) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={[
                    "px-3 py-1 text-[11px] rounded-full",
                    active
                      ? "bg-neutral-100 text-black"
                      : "text-neutral-300 hover:bg-neutral-900",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-neutral-400">Loading requests…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/80 px-4 py-8 text-center">
            <p className="text-sm text-neutral-300">No requests found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950/80">
            <table className="min-w-full divide-y divide-neutral-900 text-[11px]">
              <thead>
                <tr className="bg-neutral-950">
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">
                    Product
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Buyer</th>
                  <th className="px-3 py-2 text-left font-medium">
                    Cardholder
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    Checkout
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Created</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-neutral-900 last:border-0 hover:bg-neutral-900/70"
                  >
                    <td className="px-3 py-2 align-top">
                      <StatusBadge status={r.status || "SUBMITTED"} />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="max-w-[220px]">
                        <div className="truncate text-[11px] font-medium text-neutral-100">
                          {r.productName || "—"}
                        </div>
                        {r.productLink && (
                          <a
                            href={r.productLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 block truncate text-[10px] text-neutral-400 underline decoration-dotted"
                          >
                            {r.productLink}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="max-w-[180px] truncate text-[10px] text-neutral-300">
                        {r.buyerEmail || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="max-w-[180px] truncate text-[10px] text-neutral-300">
                        {r.matchedCardholderEmail || "—"}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      {typeof r.checkoutPrice === "number"
                        ? r.checkoutPrice.toLocaleString("en-IN", {
                            style: "currency",
                            currency: "INR",
                            maximumFractionDigits: 0,
                          })
                        : "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="text-[10px] text-neutral-300">
                        {formatDate(r.createdAt)}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <Link
                        href={`/admin/requests/${r.id}`}
                        className="inline-flex items-center rounded-full border border-neutral-700 px-2.5 py-1 text-[10px] text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
