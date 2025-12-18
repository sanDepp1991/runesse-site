"use client";

import React from "react";
import Link from "next/link";
import { useAdminDeviceGuard } from "./useAdminDeviceGuard";

type RequestStatus =
  | "SUBMITTED"
  | "ADMIN_APPROVED"
  | "MATCHED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | string;

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

function statusPillClasses(status: RequestStatus) {
  const s = (status || "SUBMITTED").toUpperCase();

  if (s === "SUBMITTED") {
    return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
  }
  if (s === "ADMIN_APPROVED") {
    return "bg-sky-500/10 text-sky-300 border border-sky-500/40";
  }
  if (s === "MATCHED") {
    return "bg-indigo-500/10 text-indigo-300 border border-indigo-500/40";
  }
  if (s === "COMPLETED") {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
  }
  if (s === "REJECTED" || s === "CANCELLED") {
    return "bg-red-500/10 text-red-300 border border-red-500/40";
  }
  return "bg-neutral-900 text-neutral-100 border border-neutral-700";
}

function statusLabel(status: RequestStatus) {
  const s = (status || "SUBMITTED").toUpperCase();
  if (s === "ADMIN_APPROVED") return "APPROVED";
  return s;
}

function statusSubtitle(status: RequestStatus) {
  const s = (status || "SUBMITTED").toUpperCase();
  if (s === "SUBMITTED") {
    return "Waiting for admin approval (cardholders cannot see this yet).";
  }
  if (s === "ADMIN_APPROVED") {
    return "Approved; eligible cardholders can now see and accept.";
  }
  if (s === "MATCHED") {
    return "Cardholder accepted; waiting for proofs and admin completion.";
  }
  if (s === "COMPLETED") {
    return "Admin marked the trade as completed after verification.";
  }
  if (s === "REJECTED") {
    return "Rejected by admin.";
  }
  if (s === "CANCELLED") {
    return "Cancelled.";
  }
  return "";
}

function formatMoney(value?: number | null) {
  if (value == null) return "—";
  return `₹${Number(value).toLocaleString("en-IN")}`;
}

function AdminRequestsList({
  items,
  emptyTitle,
  emptySubtitle,
}: {
  items: RequestItem[];
  emptyTitle: string;
  emptySubtitle: string;
}) {
  if (!items.length) {
    return (
      <div className="flex-1 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/60 flex items-center justify-center px-3 py-6">
        <div className="text-center">
          <p className="text-xs text-neutral-400">{emptyTitle}</p>
          <p className="mt-1 text-[11px] text-neutral-500">{emptySubtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
      {items.map((req) => {
        const createdAt = req.createdAt ? new Date(req.createdAt) : null;
        const pillClass = statusPillClasses(req.status as RequestStatus);

        return (
          <Link
            key={req.id}
            href={`/admin/request/${req.id}`}
            className="block rounded-xl border border-neutral-800 bg-neutral-950/80 p-3 hover:border-neutral-600 hover:bg-neutral-900/80 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-neutral-100 truncate">
                  {req.productName || "Untitled product"}
                </p>

                {req.productLink && (
                  <p className="mt-0.5 text-[11px] text-neutral-500 truncate">
                    {req.productLink}
                  </p>
                )}

                <p className="mt-1 text-[11px] text-neutral-400">
                  Buyer:{" "}
                  <span className="text-neutral-200">
                    {req.buyerEmail || "—"}
                  </span>
                </p>

                <p className="text-[11px] text-neutral-400">
                  Cardholder:{" "}
                  <span className="text-neutral-200">
                    {req.matchedCardholderEmail || "—"}
                  </span>
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={[
                    pillClass,
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium",
                  ].join(" ")}
                >
                  {statusLabel(req.status as RequestStatus)}
                </span>
                <span className="text-[11px] text-neutral-400">
                  {formatMoney(req.checkoutPrice)}
                </span>
              </div>
            </div>

            <div className="mt-1.5 flex justify-between gap-3 text-[11px] text-neutral-500">
              <span>
                {createdAt
                  ? createdAt.toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "No date"}
              </span>
              <span className="truncate">
                {statusSubtitle(req.status as RequestStatus)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

const AdminPage: React.FC = () => {
  const { checking } = useAdminDeviceGuard();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<RequestItem[]>([]);
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
        console.error("Error loading admin dashboard requests", e);
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
        <p className="text-sm text-neutral-400">Checking admin device trust…</p>
      </div>
    );
  }

  const submitted = items.filter(
    (r) => (r.status || "SUBMITTED").toUpperCase() === "SUBMITTED"
  );
  const approved = items.filter(
    (r) => (r.status || "").toUpperCase() === "ADMIN_APPROVED"
  );
  const matched = items.filter(
    (r) => (r.status || "").toUpperCase() === "MATCHED"
  );
  const done = items.filter((r) => {
    const s = (r.status || "").toUpperCase();
    return s === "COMPLETED" || s === "CANCELLED" || s === "REJECTED";
  });

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-neutral-50">
              Runesse Admin
            </h1>
            <p className="text-xs text-neutral-500">
              Overview of trades and manual verification (Phase-1)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/requests"
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 hover:border-neutral-600"
            >
              View all requests
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
        {error && (
          <div className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-neutral-400">Loading latest requests…</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <section className="flex flex-col rounded-2xl border border-neutral-900 bg-neutral-950/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-neutral-50">
                    Submitted
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    Waiting for admin approval (cardholders cannot see yet)
                  </p>
                </div>
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-400 border border-neutral-800">
                  {submitted.length}
                </span>
              </div>

              <AdminRequestsList
                items={submitted}
                emptyTitle="No submitted requests."
                emptySubtitle="New buyer requests will appear here."
              />
            </section>

            <section className="flex flex-col rounded-2xl border border-neutral-900 bg-neutral-950/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-neutral-50">
                    Approved
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    Visible to eligible cardholders (awaiting acceptance)
                  </p>
                </div>
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-400 border border-neutral-800">
                  {approved.length}
                </span>
              </div>

              <AdminRequestsList
                items={approved}
                emptyTitle="No approved requests."
                emptySubtitle="Approve a submitted request to move it here."
              />
            </section>

            <section className="flex flex-col rounded-2xl border border-neutral-900 bg-neutral-950/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-neutral-50">
                    Matched
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    Cardholder accepted; proceed to verify proofs
                  </p>
                </div>
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-400 border border-neutral-800">
                  {matched.length}
                </span>
              </div>

              <AdminRequestsList
                items={matched}
                emptyTitle="No matched requests."
                emptySubtitle="Once a cardholder accepts, it moves here."
              />
            </section>

            <section className="flex flex-col rounded-2xl border border-neutral-900 bg-neutral-950/80 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold text-neutral-50">
                    Closed
                  </h2>
                  <p className="text-[11px] text-neutral-500">
                    Completed / rejected / cancelled
                  </p>
                </div>
                <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] text-neutral-400 border border-neutral-800">
                  {done.length}
                </span>
              </div>

              <AdminRequestsList
                items={done}
                emptyTitle="No closed requests."
                emptySubtitle="Completed, cancelled, or rejected requests appear here."
              />
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPage;
