"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { NextPage } from "next";

type RequestStatus = "PENDING" | "MATCHED" | "COMPLETED" | "CANCELLED" | string;

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
  } else if (label === "CANCELLED") {
    border = "border-red-500/40";
    bg = "bg-red-500/10";
    text = "text-red-300";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${border} ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

/**
 * Request journey strip for admin.
 * Created → Cardholder matched → Completed
 */
function AdminStatusTimeline({ status }: { status: RequestStatus }) {
  const s = (status || "PENDING").toUpperCase();

  const steps = [
    { key: "CREATED", label: "Created" },
    { key: "MATCHED", label: "Cardholder matched" },
    { key: "COMPLETED", label: "Completed" },
  ];

  function isActive(stepKey: string) {
    if (stepKey === "CREATED") return true;
    if (stepKey === "MATCHED") return s === "MATCHED" || s === "COMPLETED";
    if (stepKey === "COMPLETED") return s === "COMPLETED";
    return false;
  }

  function isDone(stepKey: string) {
    if (stepKey === "CREATED") return true;
    if (stepKey === "MATCHED") return s === "MATCHED" || s === "COMPLETED";
    if (stepKey === "COMPLETED") return s === "COMPLETED";
    return false;
  }

  return (
    <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-950/60 px-4 py-3.5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-emerald-300">
          Request journey (admin view)
        </p>
        <p className="text-[11px] text-neutral-500">
          {s === "PENDING" && "Waiting for a cardholder to pick the request"}
          {s === "MATCHED" &&
            "Cardholder matched – review proofs and mark as completed"}
          {s === "COMPLETED" && "Completed – trade is closed in all workspaces"}
          {s === "CANCELLED" && "Request cancelled"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {steps.map((step, index) => {
          const active = isActive(step.key);
          const done = isDone(step.key);

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-1 min-w-[72px]">
                <div
                  className={[
                    "h-7 w-7 rounded-full border text-[11px] flex items-center justify-center",
                    done
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                      : active
                      ? "border-amber-400 bg-amber-500/15 text-amber-200"
                      : "border-neutral-700 bg-neutral-900 text-neutral-500",
                  ].join(" ")}
                >
                  {index + 1}
                </div>
                <span className="text-[10px] text-neutral-400">
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div className="flex-1 h-px bg-gradient-to-r from-neutral-700 via-neutral-700/60 to-neutral-700" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

/** Helpers for proof previews */
function isImageUrl(url: string | null | undefined) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp") ||
    lower.includes("image=") // in case query params
  );
}

interface AdminProofRowProps {
  label: string;
  party: "Buyer" | "Cardholder";
  description: string;
  url?: string | null;
}

/** Single proof row for Option C: preview + open + download */
function AdminProofRow({ label, party, description, url }: AdminProofRowProps) {
  const hasFile = !!url;
  const image = isImageUrl(url);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-3.5 text-[11px] flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-neutral-100">{label}</p>
            <span className="rounded-full border border-neutral-700/70 bg-neutral-900/80 px-2 py-[2px] text-[10px] text-neutral-400">
              {party}
            </span>
          </div>
          <p className="mt-1 text-neutral-400">{description}</p>
        </div>

        {hasFile ? (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/40">
            Uploaded
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium bg-neutral-900 text-neutral-300 border border-neutral-700">
            Not uploaded
          </span>
        )}
      </div>

      {hasFile && (
        <div className="flex flex-col gap-2">
          {image && (
            <div className="overflow-hidden rounded-lg border border-neutral-800 bg-black max-h-[260px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url as string}
                alt={label}
                className="w-full h-auto object-contain"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href={url as string}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-neutral-700 bg-neutral-950/70 px-2.5 py-1 text-[10px] text-sky-300 hover:bg-neutral-900"
            >
              Open file ↗
            </a>
            <a
              href={url as string}
              download
              className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-2.5 py-1 text-[10px] text-neutral-300 hover:bg-neutral-900"
            >
              Download file
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Admin proofs section (real files, Option C)
 * Shows buyer + cardholder proofs with preview + open + download.
 */
function AdminProofsSection({ request }: { request: any }) {
  const status = ((request?.status as string) || "PENDING")
    .toUpperCase() as RequestStatus;

  const readOnly = status === "COMPLETED";

  const buyerCheckoutUrl: string | null =
    request.buyerCheckoutScreenshotUrl ?? null;
  const buyerProductUrl: string | null =
    request.buyerProductScreenshotUrl ?? null;
  const cardholderInvoiceUrl: string | null =
    request.cardholderInvoiceUrl ?? null;
  const cardholderCardProofUrl: string | null =
    request.cardholderCardProofUrl ?? null;

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-xs font-medium text-neutral-300">
            Buyer & cardholder proofs
          </p>
          <p className="mt-1 text-[11px] text-neutral-500 max-w-xl">
            Review these screenshots and documents before marking the trade as{" "}
            <span className="font-medium text-neutral-300">COMPLETED</span>.
            This is still Phase-1 – payments happen outside Runesse, but proofs
            are stored here as an audit trail.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-neutral-500">
          <span className="rounded-full border border-neutral-700 bg-neutral-950/80 px-2 py-[2px]">
            Buyer uploads
          </span>
          <span className="rounded-full border border-neutral-700 bg-neutral-950/80 px-2 py-[2px]">
            Cardholder uploads
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-3">
        {/* Buyer proofs */}
        <AdminProofRow
          label="Buyer checkout screenshot"
          party="Buyer"
          description="Final checkout page with price, offer, taxes and delivery details."
          url={buyerCheckoutUrl}
        />
        <AdminProofRow
          label="Buyer product page / details"
          party="Buyer"
          description="Product page screenshot or PDF – confirms item & seller."
          url={buyerProductUrl}
        />

        {/* Cardholder proofs */}
        <AdminProofRow
          label="Cardholder merchant invoice"
          party="Cardholder"
          description="Final invoice issued by the merchant. Used for verification."
          url={cardholderInvoiceUrl}
        />
        <AdminProofRow
          label="Card transaction proof"
          party="Cardholder"
          description="Statement / SMS / app screenshot showing the card debit for this purchase."
          url={cardholderCardProofUrl}
        />
      </div>

      <p className="mt-3 text-[10px] text-neutral-500">
        {readOnly
          ? "This trade is completed. Proofs are locked as part of the audit trail."
          : "In this phase you can complete a trade even if some proofs are missing, but in future phases we’ll enforce stricter checks here."}
      </p>
    </div>
  );
}

const AdminRequestDetailsPage: NextPage = () => {
  const params = useParams() as Record<string, string | string[]>;
  const pathname = usePathname();

  const rawFromParams = (params && (params as any).id) || null;
  const idFromParams = Array.isArray(rawFromParams)
    ? rawFromParams[0]
    : rawFromParams;

  const segments = pathname?.split("/").filter(Boolean) ?? [];
  const lastSegment = segments[segments.length - 1] || null;

  const id = (idFromParams || lastSegment) as string | null;

  const [loading, setLoading] = React.useState(true);
  const [item, setItem] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [completing, setCompleting] = React.useState(false);

  React.useEffect(() => {
    if (!id || typeof id !== "string") {
      setError("Invalid request link.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const res = await fetch("/api/requests/list");
        const data = await res.json();

        if (!data?.ok || !Array.isArray(data.requests)) {
          throw new Error("Could not load requests");
        }

        const found = data.requests.find((r: any) => r.id === id);

        if (!found) {
          setError("Request not found.");
        } else {
          setItem(found);
        }
      } catch (e) {
        console.error("Failed to load request details", e);
        setError("Could not load this request.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const request = item;
  const status = ((request?.status as string) || "PENDING")
    .toUpperCase() as RequestStatus;

  const createdAt = request?.createdAt ? new Date(request.createdAt) : null;
  const matchedAt = request?.matchedAt ? new Date(request.matchedAt) : null;
  const completedAt = request?.completedAt
    ? new Date(request.completedAt)
    : null;

  async function handleMarkCompleted() {
    if (!request) return;
    if (status === "COMPLETED") return;

    setCompleting(true);
    try {
      const res = await fetch("/api/requests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error(
          "Non-JSON response from /api/requests/complete",
          res.status,
          text
        );
        alert("Internal server error");
        return;
      }

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        alert(data?.error || "Internal server error");
        return;
      }

      setItem(data.request);
      alert(
        "✅ Deal successfully completed.\n\nThis request has been processed and verified by admin. Buyer & cardholder can now see this as completed in their workspaces."
      );
    } catch (err) {
      console.error("Failed to complete request", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setCompleting(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-xs text-neutral-400">Loading request…</p>
      </div>
    );
  }

  // Error
  if (error || !request) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-sm text-neutral-300">{error || "Unknown error."}</p>
          <Link
            href="/admin"
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            ← Back to admin dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-xs sm:text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <span className="mr-1 text-lg">←</span>
            Back to admin dashboard
          </Link>

          <StatusBadge status={status} />
        </div>

        {/* Header */}
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">
            ADMIN • REQUEST OVERVIEW
          </p>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-50">
            {request.productName || "Request"}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
            {createdAt && (
              <span>
                Created on{" "}
                {createdAt.toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <span className="hidden sm:inline text-neutral-700">•</span>
            <span className="break-all text-neutral-600">
              Request ID: {request.id}
            </span>
          </div>

          {request.matchedCardholderEmail && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
              <span>
                Cardholder:{" "}
                <span className="font-medium">
                  {request.matchedCardholderEmail}
                </span>
              </span>
              {matchedAt && (
                <>
                  <span className="hidden sm:inline text-neutral-700">•</span>
                  <span className="text-neutral-400">
                    Matched on{" "}
                    {matchedAt.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Journey strip */}
        <AdminStatusTimeline status={status} />

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left: product, proofs, notes */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* Product card */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-xs font-medium text-neutral-400 mb-1">
                    Product
                  </p>
                  <p className="text-sm sm:text-base text-neutral-50">
                    {request.productName || "Not specified"}
                  </p>
                </div>

                {request.checkoutPrice != null && (
                  <div className="text-right">
                    <p className="text-xs text-neutral-500 mb-[2px]">
                      Checkout price
                    </p>
                    <p className="text-base sm:text-lg font-semibold text-neutral-50">
                      ₹
                      {Number(request.checkoutPrice).toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 border-top border-neutral-800/80 pt-3">
                <p className="text-xs font-medium text-neutral-400 mb-1.5">
                  Product link
                </p>
                {request.productLink ? (
                  <Link
                    href={request.productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs sm:text-sm text-sky-400 hover:text-sky-300 break-all"
                  >
                    {request.productLink}
                    <span className="ml-1 text-[11px]">↗</span>
                  </Link>
                ) : (
                  <p className="text-xs text-neutral-500">
                    No product link provided.
                  </p>
                )}
              </div>
            </div>

            {/* Admin proofs – real files, Option C */}
            <AdminProofsSection request={request} />

            {/* Buyer notes */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Buyer notes
              </p>
              {request.notes ? (
                <p className="text-sm leading-relaxed text-neutral-200 whitespace-pre-wrap">
                  {request.notes}
                </p>
              ) : (
                <p className="text-xs text-neutral-500">
                  No additional notes from buyer.
                </p>
              )}
            </div>
          </div>

          {/* Right: trust message + status + actions + audit */}
          <div className="space-y-4 sm:space-y-5">
            {/* Phase-1 trust message (admin) */}
            <div className="rounded-2xl border border-amber-700/60 bg-amber-950/40 p-4 sm:p-5">
              <p className="text-xs font-medium text-amber-200 mb-1">
                Phase-1: manual reimbursement
              </p>
              <p className="text-[11px] text-amber-100/85">
                Funds don&apos;t move inside Runesse yet. The buyer reimburses
                the cardholder outside the app after you verify the proofs.
                Escrow will plug into this same flow in the next phase.
              </p>
            </div>

            {/* Status card */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Status (admin)
              </p>
              <p className="text-xs text-neutral-500 mb-3">
                This is the admin view of the lifecycle state. Changes here
                update buyer & cardholder dashboards.
              </p>

              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2.5 text-xs text-neutral-200 flex items-center justify-between">
                <span>Current status</span>
                <StatusBadge status={status} />
              </div>

              {completedAt && (
                <p className="mt-2 text-[11px] text-neutral-500">
                  Marked completed on{" "}
                  {completedAt.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            {/* Admin actions */}
            <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/40 p-4 sm:p-5 space-y-2">
              <p className="text-xs font-medium text-emerald-200">
                Admin actions
              </p>
              <p className="text-[11px] text-emerald-200/85">
                Once you are satisfied with the buyer & cardholder proofs, mark
                this request as <span className="font-semibold">COMPLETED</span>
                . This will update both dashboards.
              </p>

              <button
                type="button"
                onClick={handleMarkCompleted}
                disabled={completing || status === "COMPLETED"}
                className="mt-1 w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 px-4 py-2 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {status === "COMPLETED"
                  ? "Already completed"
                  : completing
                  ? "Marking as completed…"
                  : "Mark as completed"}
              </button>
            </div>

            {/* Audit trail placeholder */}
            <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-1">
                Audit trail (coming soon)
              </p>
              <p className="mt-1 text-[11px] text-neutral-500">
                Later, this block will record who approved the request, when it
                was completed, hashes of proofs, and payment provider
                references. For now, we&apos;re only tracking status changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequestDetailsPage;
