"use client";

import React from "react";
import Link from "next/link";
import { useAdminDeviceGuard } from "../useAdminDeviceGuard";

type RequestStatus =
  | "PENDING"
  | "MATCHED"
  | "COMPLETED"
  | "CANCELLED"
  | "APPROVED"
  | "REJECTED"
  | string;

type FilterKey = "all" | "pending" | "matched" | "completed" | "cancelled";

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
  const label = (status || "PENDING").toUpperCase();

  let border = "border-neutral-700";
  let bg = "bg-neutral-900/80";
  let text = "text-neutral-100";

  if (label === "PENDING") {
    border = "border-amber-500/40";
    bg = "bg-amber-500/10";
    text = "text-amber-300";
  } else if (label === "MATCHED") {
    border = "border-sky-500/40";
    bg = "bg-sky-500/10";
    text = "text-sky-300";
  } else if (label === "COMPLETED" || label === "APPROVED") {
    border = "border-emerald-500/40";
    bg = "bg-emerald-500/10";
    text = "text-emerald-300";
  } else if (label === "CANCELLED" || label === "REJECTED") {
    border = "border-red-500/40";
    bg = "bg-red-500/10";
    text = "text-red-300";
  }

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium",
        border,
        bg,
        text,
      ].join(" ")}
    >
      {label}
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

function formatMoney(value?: number | null) {
  if (value == null) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

export default function AdminRequestsPage() {
  const { checking } = useAdminDeviceGuard();

  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RequestItem[]>([]);
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (checking) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/requests/list", {
          method: "GET",
          cache: "no-store",
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
  }, [checking]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">
          Checking admin device trust…
        </p>
      </div>
    );
  }

  function applyFilter(list: RequestItem[]): RequestItem[] {
    if (filter === "all") return list;
    return list.filter((r) => {
      const s = (r.status || "PENDING").toUpperCase();
      if (filter === "pending") return s === "PENDING";
      if (filter === "matched") return s === "MATCHED";
      if (filter === "completed")
        return s === "COMPLETED" || s === "APPROVED";
      if (filter === "cancelled")
        return s === "CANCELLED" || s === "REJECTED";
      return true;
    });
  }

  const filtered = applyFilter(items);

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-neutral-50">
              All Requests
            </h1>
            <p className="text-xs text-neutral-500">
              Monitor and drill into buyer / cardholder requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 hover:border-neutral-600"
            >
              Admin overview
            </Link>
            <Link
              href="/admin/ledger"
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 hover:border-neutral-600"
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
                ["pending", "Pending"],
                ["matched", "Matched"],
                ["completed", "Completed"],
                ["cancelled", "Cancelled"],
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
                      : "text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900",
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-neutral-500">
            Showing {filtered.length} of {items.length} total requests
          </p>
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
            <p className="mt-1 text-[11px] text-neutral-500">
              New buyer trades will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-neutral-900 bg-neutral-950/80">
            <table className="min-w-full text-xs">
              <thead className="border-b border-neutral-900 bg-neutral-950">
                <tr className="text-[11px] text-neutral-500">
                  <th className="px-3 py-2 text-left font-medium">Request</th>
                  <th className="px-3 py-2 text-left font-medium">Buyer</th>
                  <th className="px-3 py-2 text-left font-medium">
                    Cardholder
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Checkout
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Created</th>
                  <th className="px-3 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-neutral-900 last:border-0 hover:bg-neutral-900/70"
                  >
                    <td className="px-3 py-2 align-top">
                      <div className="max-w-[220px]">
                        <p className="truncate text-neutral-100">
                          {r.productName || "Untitled product"}
                        </p>
                        {r.productLink && (
                          <p className="truncate text-[11px] text-neutral-500">
                            {r.productLink}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-neutral-300">
                      {r.buyerEmail || "—"}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-neutral-300">
                      {r.matchedCardholderEmail || "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <StatusBadge status={r.status || "PENDING"} />
                    </td>
                    <td className="px-3 py-2 align-top text-right text-[11px] text-neutral-200">
                      {formatMoney(r.checkoutPrice)}
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] text-neutral-400">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <Link
                        href={`/admin/request/${r.id}`}
                        className="inline-flex items-center rounded-full border border-neutral-700 px-3 py-1 text-[11px] text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900"
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
