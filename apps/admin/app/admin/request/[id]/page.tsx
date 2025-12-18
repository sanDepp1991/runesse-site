"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { NextPage } from "next";
import { useAdminDeviceGuard } from "../../useAdminDeviceGuard";

type RequestStatus =
  | "SUBMITTED"
  | "ADMIN_APPROVED"
  | "MATCHED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | string;

interface RequestDetail {
  id: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  buyerCheckoutScreenshotUrl?: string | null;
  buyerProductScreenshotUrl?: string | null;
  cardholderInvoiceUrl?: string | null;
  cardholderCardProofUrl?: string | null;
  buyerEmail?: string | null;
  productLink?: string | null;
  productName?: string | null;
  checkoutPrice?: number | null;
  notes?: string | null;
  status?: RequestStatus;
  matchedCardholderEmail?: string | null;
  matchedAt?: string | null;
  completedAt?: string | null;
}

interface LedgerItem {
  id: string;
  createdAt: string;
  eventType: string;
  scope: string;
  side: string | null;
  amount: number | null;
  currency: string | null;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
  meta?: any;
}

function statusPillClasses(status: RequestStatus) {
  const s = (status || "SUBMITTED").toUpperCase();

  if (s === "SUBMITTED") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
  if (s === "ADMIN_APPROVED") {
    return "border-sky-500/40 bg-sky-500/10 text-sky-300";
  }
  if (s === "MATCHED") {
    return "border-indigo-500/40 bg-indigo-500/10 text-indigo-300";
  }
  if (s === "COMPLETED") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }
  if (s === "REJECTED" || s === "CANCELLED") {
    return "border-red-500/40 bg-red-500/10 text-red-300";
  }
  return "border-neutral-700 bg-neutral-900 text-neutral-100";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const AdminRequestDetailsPage: NextPage = () => {
  // ✅ IMPORTANT: ALL hooks must be called before any conditional return.
  const { checking } = useAdminDeviceGuard();

  const params = useParams() as Record<string, string | string[]>;
  const pathname = usePathname();

  const rawFromParams = (params && (params as any).id) || null;
  const idFromParams = Array.isArray(rawFromParams)
    ? rawFromParams[0]
    : rawFromParams;
  const requestId = idFromParams || "";

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [request, setRequest] = React.useState<RequestDetail | null>(null);
  const [ledgerItems, setLedgerItems] = React.useState<LedgerItem[]>([]);
  const [marking, setMarking] = React.useState<
    "ADMIN_APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED" | null
  >(null);

  React.useEffect(() => {
    // ✅ IMPORTANT: keep effect stable and avoid running while checking
    if (checking) return;
    if (!requestId) return;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        // Load all requests and pick this one
        const resReq = await fetch("/api/requests/list", {
          method: "GET",
          cache: "no-store",
        });
        const dataReq = await resReq.json();

        if (!resReq.ok || !dataReq?.ok) {
          throw new Error(dataReq?.error || "Failed to load request");
        }

        const found: RequestDetail | undefined = (dataReq.requests || []).find(
          (r: any) => String(r.id) === String(requestId)
        );
        if (!found) {
          throw new Error("Request not found");
        }

        setRequest(found);

        // Load ledger items for this request
        const resLed = await fetch(`/api/admin/requests/${requestId}/ledger`, {
          method: "GET",
          cache: "no-store",
        });
        const dataLed = await resLed.json().catch(() => null);

        // ✅ Be tolerant: some routes return `items`, some return `entries`
        const list =
          (dataLed?.items && Array.isArray(dataLed.items) && dataLed.items) ||
          (dataLed?.entries &&
            Array.isArray(dataLed.entries) &&
            dataLed.entries) ||
          [];

        if (resLed.ok && dataLed?.ok && Array.isArray(list)) {
          setLedgerItems(list);
        } else {
          setLedgerItems([]);
        }

        setLoading(false);
      } catch (e: any) {
        console.error("[AdminRequestDetailsPage] load error", e);
        setError(e?.message || "Failed to load request");
        setLoading(false);
      }
    }

    load();
  }, [checking, requestId]);

  async function updateStatus(
    newStatus: "ADMIN_APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED"
  ) {
    if (!requestId) return;

    setMarking(newStatus);
    setError(null);

    try {
      const res = await fetch("/api/admin/requests/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          requestId,
          newStatus, // ✅ keep your backend contract
          reason: null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to update status");
      }

      // Refresh request state from response (if provided)
      if (data.request) {
        setRequest(data.request);
      } else {
        // Fallback: re-load to reflect status
        // (keeps UI correct even if backend doesn't return request)
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        (async () => {
          const resReq = await fetch("/api/requests/list", {
            method: "GET",
            cache: "no-store",
          });
          const dataReq = await resReq.json();
          const found: RequestDetail | undefined = (dataReq.requests || []).find(
            (r: any) => String(r.id) === String(requestId)
          );
          setRequest(found || null);
        })();
      }
    } catch (e: any) {
      console.error("Failed to update request status", e);
      setError(e?.message || "Failed to update status");
    } finally {
      setMarking(null);
    }
  }

  const sUpper = (request?.status || "").toUpperCase();
  const isCompleted = sUpper === "COMPLETED";
  const isCancelled = sUpper === "CANCELLED";
  const isRejected = sUpper === "REJECTED";
  const isSubmitted = sUpper === "SUBMITTED";
  const isApproved = sUpper === "ADMIN_APPROVED";
  const isMatched = sUpper === "MATCHED";

  // ✅ NOW it is safe to return conditionally (after hooks)
  if (checking) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Checking admin device trust…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-neutral-500 mb-0.5">
              <Link
                href="/admin/requests"
                className="text-neutral-400 hover:text-neutral-100 hover:underline underline-offset-4"
              >
                Requests
              </Link>{" "}
              <span className="mx-1">/</span>
              <span className="text-neutral-500">
                {requestId ? requestId : "…"}
              </span>
            </p>
            <h1 className="text-sm font-semibold text-neutral-50">
              Request details
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/ledger"
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 hover:border-neutral-600"
            >
              Ledger
            </Link>
            <Link
              href="/admin"
              className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-100 hover:border-neutral-600"
            >
              Admin overview
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 space-y-4">
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-neutral-400">
              Loading request details…
            </p>
          </div>
        ) : !request ? (
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/80 px-4 py-8 text-center">
            <p className="text-sm text-neutral-300">Request not found.</p>
          </div>
        ) : (
          <>
            {/* Top summary */}
            <section className="rounded-2xl border border-neutral-900 bg-neutral-950/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[220px]">
                  <p className="text-xs text-neutral-400">Product</p>
                  <p className="text-sm font-medium text-neutral-50">
                    {request.productName || "Untitled product"}
                  </p>
                  {request.productLink && (
                    <a
                      href={request.productLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-[11px] text-sky-400 hover:text-sky-300 break-all"
                    >
                      {request.productLink}
                    </a>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] text-neutral-400">
                    <div>
                      <p className="text-neutral-500">Buyer</p>
                      <p className="text-neutral-200">
                        {request.buyerEmail || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Cardholder</p>
                      <p className="text-neutral-200">
                        {request.matchedCardholderEmail || "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Checkout price</p>
                      <p className="text-neutral-200">
                        {request.checkoutPrice != null
                          ? `₹${Number(request.checkoutPrice).toLocaleString(
                              "en-IN"
                            )}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Created at</p>
                      <p className="text-neutral-200">
                        {formatDateTime(request.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-xs space-y-3">
                  <div>
                    <p className="text-[11px] text-neutral-500 mb-1">Status</p>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium border",
                        statusPillClasses(request.status || "SUBMITTED"),
                      ].join(" ")}
                    >
                      {(request.status || "SUBMITTED").toUpperCase()}
                    </span>

                    <div className="mt-2 space-y-1 text-[11px] text-neutral-400">
                      <p>
                        Matched at:{" "}
                        <span className="text-neutral-200">
                          {formatDateTime(request.matchedAt)}
                        </span>
                      </p>
                      <p>
                        Completed at:{" "}
                        <span className="text-neutral-200">
                          {formatDateTime(request.completedAt)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 text-[11px]">
                    <Link
                      href={`/admin/request/${requestId}/payments`}
                      className="inline-flex items-center justify-center rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-200 hover:bg-emerald-500/20"
                    >
                      Open payments & settlement panel
                    </Link>

                    <div className="flex gap-2">
                      {isSubmitted && (
                        <>
                          <button
                            type="button"
                            disabled={marking != null}
                            onClick={() => updateStatus("ADMIN_APPROVED")}
                            className="flex-1 rounded-lg border border-sky-500/50 bg-sky-500/10 px-3 py-1.5 text-[11px] font-medium text-sky-200 hover:bg-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Makes the request visible to eligible cardholders"
                          >
                            {marking === "ADMIN_APPROVED"
                              ? "Approving…"
                              : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={marking != null}
                            onClick={() => updateStatus("REJECTED")}
                            className="flex-1 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {marking === "REJECTED" ? "Rejecting…" : "Reject"}
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <>
                          <button
                            type="button"
                            disabled={marking != null}
                            onClick={() => updateStatus("REJECTED")}
                            className="flex-1 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {marking === "REJECTED" ? "Rejecting…" : "Reject"}
                          </button>
                          <button
                            type="button"
                            disabled={marking != null}
                            onClick={() => updateStatus("CANCELLED")}
                            className="flex-1 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {marking === "CANCELLED" ? "Cancelling…" : "Cancel"}
                          </button>
                        </>
                      )}

                      {isMatched && (
                        <>
                          <button
                            type="button"
                            disabled={marking != null}
                            onClick={() => updateStatus("COMPLETED")}
                            className="flex-1 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {marking === "COMPLETED"
                              ? "Marking…"
                              : "Mark completed"}
                          </button>
                          <button
                            type="button"
                            disabled={marking != null}
                            onClick={() => updateStatus("CANCELLED")}
                            className="flex-1 rounded-lg border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {marking === "CANCELLED" ? "Cancelling…" : "Cancel"}
                          </button>
                        </>
                      )}

                      {(isCompleted || isCancelled || isRejected) && (
                        <div className="flex-1 rounded-lg border border-neutral-800 bg-neutral-950/60 px-3 py-2 text-[11px] text-neutral-400">
                          No actions available (request is closed).
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {request.notes && (
                <div className="mt-4">
                  <p className="text-[11px] text-neutral-500 mb-1">Notes</p>
                  <p className="text-[11px] text-neutral-200 whitespace-pre-wrap">
                    {request.notes}
                  </p>
                </div>
              )}
            </section>

            {/* Ledger timeline */}
            <section className="rounded-2xl border border-neutral-900 bg-neutral-950/80 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-neutral-50">
                  Ledger timeline
                </h2>
                <Link
                  href={
                    requestId
                      ? `/admin/ledger?requestId=${encodeURIComponent(requestId)}`
                      : "/admin/ledger"
                  }
                  className="text-[11px] text-neutral-400 hover:text-neutral-100 underline underline-offset-4"
                >
                  Open in ledger explorer
                </Link>
              </div>

              {ledgerItems.length === 0 ? (
                <p className="text-[11px] text-neutral-500">
                  No ledger entries found for this request.
                </p>
              ) : (
                <ol className="space-y-2 text-[11px]">
                  {ledgerItems.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-neutral-900 bg-neutral-950 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-100">
                            {entry.eventType}
                          </p>
                          <p className="text-[10px] text-neutral-500 mt-0.5">
                            {entry.scope} · {entry.side || "NO_SIDE"} ·{" "}
                            {entry.referenceType}:{entry.referenceId}
                          </p>
                          {entry.description && (
                            <p className="mt-1 text-[11px] text-neutral-300">
                              {entry.description}
                            </p>
                          )}
{entry.meta && (
  <details className="mt-2">
    <summary className="cursor-pointer text-[11px] text-neutral-400 hover:text-neutral-200">
      View raw meta
    </summary>
    <pre className="mt-2 whitespace-pre-wrap break-words text-[10px] text-neutral-400">
      {JSON.stringify(entry.meta, null, 2)}
    </pre>
  </details>
)}

                        </div>
                        <div className="text-right text-[10px] text-neutral-400 whitespace-nowrap">
                          {formatDateTime(entry.createdAt)}
                          {entry.amount != null && (
                            <p className="mt-1 text-neutral-100">
                              ₹{Number(entry.amount).toLocaleString("en-IN")}
                              {entry.currency && (
                                <span className="ml-1 text-neutral-500">
                                  {entry.currency}
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminRequestDetailsPage;
