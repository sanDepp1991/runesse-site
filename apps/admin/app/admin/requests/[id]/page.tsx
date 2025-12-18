"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAdminDeviceGuard } from "../../useAdminDeviceGuard";

/* ---------------------- Toast Component ---------------------- */

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed top-4 right-4 z-50 rounded-md bg-neutral-900 border border-neutral-700 px-4 py-2 text-sm text-neutral-100 shadow-xl animate-fade-in">
      {message}
    </div>
  );
}

/* ---------------------- Types ---------------------- */

type RequestStatus =
  | "SUBMITTED"
  | "ADMIN_APPROVED"
  | "MATCHED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | string;

type RequestDetails = {
  id: string;
  productName?: string | null;
  productLink?: string | null;
  checkoutPrice?: number | null;
  status?: RequestStatus;
  createdAt?: string | null;
  matchedAt?: string | null;
  buyerEmail?: string | null;
  matchedCardholderEmail?: string | null;
  requestedIssuer?: string | null;
  requestedNetwork?: string | null;
  requestedCardLabel?: string | null;
  offerPercent?: number | null;
  futureBenefitPercent?: number | null;
  notes?: string | null;
  buyerCheckoutScreenshotUrl?: string | null;
  buyerProductScreenshotUrl?: string | null;
  cardholderInvoiceUrl?: string | null;
  cardholderCardProofUrl?: string | null;
};

type LedgerItem = {
  id: string;
  createdAt: string;
  scope: string;
  eventType: string;
  description: string | null;
};

type ActionKey = "approve" | "mark-buyer-deposit" | "mark-reimbursement";

/* ---------------------- Helpers ---------------------- */

function StatusBadge({ status }: { status: RequestStatus | undefined }) {
  const raw = (status || "SUBMITTED").toUpperCase();

  let border = "border-neutral-700";
  let bg = "bg-neutral-900/80";
  let text = "text-neutral-100";
  let label = raw;

  if (raw === "SUBMITTED") {
    border = "border-amber-500/40";
    bg = "bg-amber-500/10";
    text = "text-amber-300";
    label = "Pending admin review";
  } else if (raw === "ADMIN_APPROVED") {
    border = "border-sky-500/40";
    bg = "bg-sky-500/10";
    text = "text-sky-300";
    label = "Approved – visible to cardholders";
  } else if (raw === "MATCHED") {
    border = "border-sky-500/40";
    bg = "bg-sky-500/10";
    text = "text-sky-300";
    label = "Matched with cardholder";
  } else if (raw === "COMPLETED") {
    border = "border-emerald-500/40";
    bg = "bg-emerald-500/10";
    text = "text-emerald-300";
    label = "Completed";
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

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  });
}

/* ---------------------- Main Component ---------------------- */

export default function AdminRequestDetailPage() {
  const { checking, allowed } = useAdminDeviceGuard();
  const params = useParams<{ id: string }>();
  const id = (params?.id as string) || "";

  const [loading, setLoading] = React.useState(true);
  const [request, setRequest] = React.useState<RequestDetails | null>(null);
  const [ledger, setLedger] = React.useState<LedgerItem[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const [toast, setToast] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState<ActionKey | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  /* ---------------------- Load request + ledger ---------------------- */

  async function loadData(requestId: string) {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/requests/${requestId}`);
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setError(data?.error || "Failed to load request.");
        setRequest(null);
        setLedger([]);
        setLoading(false);
        return;
      }

      const led = await fetch(`/api/admin/requests/${requestId}/ledger`);
      const ledData = led.ok ? await led.json() : { items: [] };

      setRequest(data.request);
      setLedger(ledData.items || []);
      setLoading(false);
    } catch (e: any) {
      console.error("[AdminRequestDetailPage] load error", e);
      setError(e?.message || "Unexpected error");
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (!allowed || !id) return;
    loadData(id);
  }, [allowed, id]);

  /* ---------------------- Admin Actions ---------------------- */

  async function handleAction(action: ActionKey, successMessage: string) {
    const confirmed = window.confirm("Are you sure?");
    if (!confirmed || !id) return;

    try {
      setSubmitting(action);

      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        // ignore JSON parse error if body is empty
      }

      if (!res.ok || data?.ok === false) {
        const msg =
          data?.error ||
          `Failed to ${action.replace(/-/g, " ")}, server returned ${res.status}`;
        showToast(msg);
        return;
      }

      showToast(successMessage);
      // Reload both request and ledger so timeline is up to date
      await loadData(id);
    } catch (err: any) {
      console.error("[AdminRequestDetailPage] handleAction error", err);
      showToast(err?.message || "Action failed");
    } finally {
      setSubmitting(null);
    }
  }

  if (checking)
    return (
      <div className="min-h-screen bg-black text-neutral-300 flex items-center justify-center">
        Checking device trust…
      </div>
    );

  if (!allowed) return null;

  /* ---------------------- Render ---------------------- */

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      {toast && <Toast message={toast} />}

      {/* HEADER */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/requests"
                className="text-xs text-neutral-400 hover:text-neutral-200"
              >
                ← Back to requests
              </Link>
              {request && <StatusBadge status={request.status} />}
            </div>
            <h1 className="mt-2 text-sm font-semibold text-neutral-100 max-w-xl truncate">
              {request?.productName || "Request details"}
            </h1>
            <p className="text-[11px] text-neutral-500">
              ID: {request?.id}
              {" · "}
              Created {formatDate(request?.createdAt, true)}
            </p>
          </div>

          {/* ACTION BAR */}
          <div className="flex items-center gap-2">
            {/* Approve */}
            <button
              onClick={() =>
                handleAction("approve", "Request approved successfully")
              }
              disabled={submitting !== null}
              className={[
                "rounded-lg border border-sky-500/40 bg-sky-600/20 px-3 py-1.5 text-xs hover:bg-sky-600/30",
                submitting !== null ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {submitting === "approve" ? "Approving…" : "Approve Request"}
            </button>

            {/* Buyer Deposit */}
            <button
              onClick={() =>
                handleAction(
                  "mark-buyer-deposit",
                  "Buyer deposit entry added to ledger"
                )
              }
              disabled={submitting !== null}
              className={[
                "rounded-lg border border-amber-500/40 bg-amber-600/20 px-3 py-1.5 text-xs hover:bg-amber-600/30",
                submitting !== null ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {submitting === "mark-buyer-deposit"
                ? "Marking…"
                : "Mark Buyer Deposit"}
            </button>

            {/* Reimbursed */}
            <button
              onClick={() =>
                handleAction(
                  "mark-reimbursement",
                  "Reimbursement entry recorded"
                )
              }
              disabled={submitting !== null}
              className={[
                "rounded-lg border border-emerald-500/40 bg-emerald-600/20 px-3 py-1.5 text-xs hover:bg-emerald-600/30",
                submitting !== null ? "opacity-60 cursor-not-allowed" : "",
              ].join(" ")}
            >
              {submitting === "mark-reimbursement"
                ? "Marking…"
                : "Mark Reimbursed"}
            </button>
          </div>
        </div>
      </header>

      {/* BODY */}
      <main className="mx-auto max-w-6xl px-4 py-4 space-y-6">
        {loading ? (
          <p className="text-neutral-400">Loading…</p>
        ) : !request ? (
          <p className="text-neutral-400">Request not found.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* LEFT SIDE */}
            <div className="space-y-4 lg:col-span-2">
              {/* Summary */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <h2 className="text-xs font-semibold mb-3">Summary</h2>
                <dl className="grid grid-cols-2 gap-y-2 text-[11px]">
                  <div>
                    <dt className="text-neutral-500">Buyer</dt>
                    <dd>{request.buyerEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Cardholder</dt>
                    <dd>{request.matchedCardholderEmail || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Issuer</dt>
                    <dd>{request.requestedIssuer || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Network</dt>
                    <dd>{request.requestedNetwork || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Card Label</dt>
                    <dd>{request.requestedCardLabel || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Matched At</dt>
                    <dd>{formatDate(request.matchedAt, true)}</dd>
                  </div>
                </dl>
              </div>

              {/* Proofs */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <h2 className="text-xs font-semibold mb-3">Proofs</h2>

                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <div className="text-neutral-500 mb-1">
                      Buyer checkout screenshot
                    </div>
                    {request.buyerCheckoutScreenshotUrl ? (
                      <a
                        href={request.buyerCheckoutScreenshotUrl}
                        target="_blank"
                        className="underline text-neutral-200"
                      >
                        View checkout screenshot
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </div>

                  <div>
                    <div className="text-neutral-500 mb-1">
                      Buyer product screenshot
                    </div>
                    {request.buyerProductScreenshotUrl ? (
                      <a
                        href={request.buyerProductScreenshotUrl}
                        target="_blank"
                        className="underline text-neutral-200"
                      >
                        View product screenshot
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </div>

                  <div>
                    <div className="text-neutral-500 mb-1">
                      Cardholder invoice
                    </div>
                    {request.cardholderInvoiceUrl ? (
                      <a
                        href={request.cardholderInvoiceUrl}
                        target="_blank"
                        className="underline text-neutral-200"
                      >
                        View invoice
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </div>

                  <div>
                    <div className="text-neutral-500 mb-1">
                      Cardholder card proof
                    </div>
                    {request.cardholderCardProofUrl ? (
                      <a
                        href={request.cardholderCardProofUrl}
                        target="_blank"
                        className="underline text-neutral-200"
                      >
                        View card proof
                      </a>
                    ) : (
                      "Not uploaded"
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <h2 className="text-xs font-semibold mb-3">Buyer Notes</h2>
                <p className="text-[11px] text-neutral-300 whitespace-pre-wrap">
                  {request.notes || "No notes."}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE — LEDGER */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
                <h2 className="text-xs font-semibold mb-3">Ledger Timeline</h2>
                {ledger.length === 0 ? (
                  <p className="text-[11px] text-neutral-500">
                    No ledger entries yet.
                  </p>
                ) : (
                  <ol className="text-[11px] space-y-3">
                    {ledger.map((item) => (
                      <li
                        key={item.id}
                        className="border-l pl-3 border-neutral-700"
                      >
                        <div className="text-neutral-500">
                          {formatDate(item.createdAt, true)}
                        </div>
                        <div className="text-neutral-100">
                          {item.eventType}
                        </div>
                        {item.description && (
                          <div className="text-neutral-400">
                            {item.description}
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
