"use client";

import React from "react";
import Link from "next/link";

type RequestStatus =
  | "PENDING"
  | "MATCHED"
  | "COMPLETED"
  | "CANCELLED"
  | "APPROVED"
  | "REJECTED"
  | string;

type FilterKey = "all" | "pending" | "matched" | "completed" | "cancelled";

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
  } else if (label === "COMPLETED") {
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

export default function AdminRequestsPage() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<any[]>([]);
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/requests/all");
        const data = await res.json();
        if (data?.ok && Array.isArray(data.requests)) {
          setItems(data.requests);
        }
      } catch (e) {
        console.error("Failed to load admin requests", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered =
    filter === "all"
      ? items
      : items.filter((r) => {
          const st = (r.status || "").toLowerCase();
          if (filter === "pending") return st === "pending";
          if (filter === "matched") return st === "matched";
          if (filter === "completed") return st === "completed";
          if (filter === "cancelled") return st === "cancelled" || st === "rejected";
          return true;
        });

  async function handleStatusChange(
    e: React.MouseEvent<HTMLButtonElement>,
    requestId: string,
    newStatus: "COMPLETED" | "CANCELLED"
  ) {
    e.stopPropagation(); // prevent row click navigation
    try {
      setBusyId(requestId);
      const res = await fetch("/api/admin/requests/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, newStatus }),
      });

      const data = await res.json();
      if (!data.ok) {
        alert(data.error || "Could not update status.");
        return;
      }

      const updated = data.request;
      // Update local list
      setItems((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      );
    } catch (err) {
      console.error("Admin status update error", err);
      alert("Something went wrong while updating status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl border border-neutral-700 flex items-center justify-center text-xs font-semibold tracking-widest">
              R
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Runesse</span>
              <span className="text-[11px] text-neutral-400">
                Admin • Requests console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400">
            <Link
              href="/buyer"
              className="rounded-full border border-neutral-700 px-3 py-1 hover:bg-neutral-900 transition"
            >
              Buyer view
            </Link>
            <Link
              href="/cardholder"
              className="rounded-full border border-neutral-700 px-3 py-1 hover:bg-neutral-900 transition"
            >
              Cardholder view
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 bg-black">
        <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
          {/* Intro */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-400">
                  Admin • Oversight
                </p>
                <h1 className="mt-1 text-xl font-semibold sm:text-2xl">
                  All buyer requests in one place.
                </h1>
                <p className="mt-2 text-sm text-neutral-300 max-w-2xl">
                  Use this console to monitor and update requests across the
                  platform. In future phases, this will power full verification
                  and settlement workflows.
                </p>
              </div>
            </div>
          </section>

          {/* Controls + table */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-1.5">
                {([
                  { key: "all", label: "All" },
                  { key: "pending", label: "Pending" },
                  { key: "matched", label: "Matched" },
                  { key: "completed", label: "Completed" },
                  { key: "cancelled", label: "Cancelled / Rejected" },
                ] as const).map((f) => {
                  const active = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      className={[
                        "rounded-full border px-3 py-1 text-[11px] font-medium transition",
                        active
                          ? "border-neutral-100 bg-neutral-100 text-black"
                          : "border-neutral-700 text-neutral-300 hover:bg-neutral-900",
                      ].join(" ")}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] text-neutral-500">
                Total: {items.length} • Showing: {filtered.length}
              </p>
            </div>

            {/* Table / list */}
            {loading ? (
              <div className="flex items-center justify-center py-10 text-xs text-neutral-500">
                Loading requests…
              </div>
            ) : !items.length ? (
              <div className="rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 px-4 py-8 text-center">
                <p className="text-sm text-neutral-300">No requests yet.</p>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Once buyers start creating requests, they&apos;ll appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-neutral-300">
                  <thead className="border-b border-neutral-800 text-[11px] text-neutral-500">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Created</th>
                      <th className="py-2 pr-3 font-medium">Product</th>
                      <th className="py-2 pr-3 font-medium">Buyer</th>
                      <th className="py-2 pr-3 font-medium">Price</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Matched with</th>
                      <th className="py-2 pr-0 font-medium text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {filtered.map((req) => {
                      const created = req.createdAt
                        ? new Date(req.createdAt)
                        : null;
                      const isBusy = busyId === req.id;
                      const st = (req.status || "").toUpperCase();

                      return (
                        <tr
                          key={req.id}
                          className="hover:bg-neutral-950/70 transition cursor-pointer"
                          onClick={() =>
                            (window.location.href = `/buyer/request/${req.id}`)
                          }
                        >
                          <td className="py-2.5 pr-3 align-top whitespace-nowrap text-[11px] text-neutral-500">
                            {created
                              ? created.toLocaleString("en-IN", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </td>
                          <td className="py-2.5 pr-3 align-top">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs text-neutral-100 truncate max-w-[220px]">
                                {req.productName || "Unnamed product"}
                              </span>
                              <span className="text-[11px] text-neutral-500 truncate max-w-[260px]">
                                {req.productLink}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 align-top text-[11px] text-neutral-400">
                            {req.buyerEmail || "—"}
                          </td>
                          <td className="py-2.5 pr-3 align-top text-[11px] text-neutral-300">
                            {req.checkoutPrice != null
                              ? `₹${Number(req.checkoutPrice).toLocaleString(
                                  "en-IN"
                                )}`
                              : "—"}
                          </td>
                          <td className="py-2.5 pr-3 align-top">
                            <StatusBadge status={req.status as RequestStatus} />
                          </td>
                          <td className="py-2.5 pr-3 align-top text-[11px] text-neutral-400">
                            {req.matchedCardholderEmail || "—"}
                          </td>
                          <td className="py-2.5 pr-0 align-top text-right">
                            <div className="flex justify-end gap-1.5">
                              {st === "MATCHED" && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={(e) =>
                                      handleStatusChange(
                                        e,
                                        req.id,
                                        "COMPLETED"
                                      )
                                    }
                                    className={[
                                      "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                                      isBusy
                                        ? "border-neutral-700 text-neutral-500"
                                        : "border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/10",
                                    ].join(" ")}
                                  >
                                    {isBusy ? "Saving…" : "Mark completed"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={(e) =>
                                      handleStatusChange(
                                        e,
                                        req.id,
                                        "CANCELLED"
                                      )
                                    }
                                    className={[
                                      "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                                      isBusy
                                        ? "border-neutral-700 text-neutral-500"
                                        : "border-red-500/60 text-red-300 hover:bg-red-500/10",
                                    ].join(" ")}
                                  >
                                    {isBusy ? "Saving…" : "Cancel"}
                                  </button>
                                </>
                              )}
                              {st !== "MATCHED" && (
                                <span className="text-[10px] text-neutral-600">
                                  —
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
