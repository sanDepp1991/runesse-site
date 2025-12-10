// apps/web/app/buyer/request/[id]/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { calculatePricing } from "../../../lib/pricing";

type RequestStatus = "PENDING" | "MATCHED" | "COMPLETED" | "CANCELLED" | string;

function StatusBadge({ status }: { status: RequestStatus }) {
  const label = (status || "PENDING").toUpperCase();

  let border = "border-neutral-700";
  let bg = "bg-neutral-900/80";
  let text = "text-neutral-100";

  if (label === "PENDING") {
    border = "border-amber-500/40";
    bg = "bg-amber-950/40";
    text = "text-amber-200";
  } else if (label === "MATCHED") {
    border = "border-sky-500/40";
    bg = "bg-sky-950/40";
    text = "text-sky-200";
  } else if (label === "COMPLETED") {
    border = "border-emerald-500/40";
    bg = "bg-emerald-950/40";
    text = "text-emerald-200";
  } else if (label === "CANCELLED") {
    border = "border-red-500/40";
    bg = "bg-red-950/40";
    text = "text-red-200";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium ${border} ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

type ProofType =
  | "buyer-checkout"
  | "buyer-product"
  | "cardholder-invoice"
  | "cardholder-card-proof";

function getProofUrl(request: any, proofType: ProofType): string | null {
  if (!request) return null;

  const map: Record<ProofType, string[]> = {
    "buyer-checkout": [
      "buyerCheckoutUrl",
      "buyerCheckoutProofUrl",
      "buyerCheckoutScreenshotUrl",
    ],
    "buyer-product": [
      "buyerProductUrl",
      "buyerProductProofUrl",
      "buyerProductScreenshotUrl",
    ],
    "cardholder-invoice": [
      "cardholderInvoiceUrl",
      "chInvoiceUrl",
      "cardholderInvoiceProofUrl",
    ],
    "cardholder-card-proof": [
      "cardholderCardProofUrl",
      "chCardProofUrl",
      "cardholderTransactionProofUrl",
    ],
  };

  for (const key of map[proofType]) {
    const val = (request as any)?.[key];
    if (typeof val === "string" && val.trim().length > 0) {
      return val;
    }
  }

  return null;
}

type ProofUploadSlotProps = {
  requestId: string;
  proofType: ProofType;
  label: string;
  description: string;
  existingUrl?: string | null;
  disabled?: boolean;
  onUploaded?: (url: string | null) => void;
  uploadEndpoint?: string;
};

function ProofUploadSlot({
  requestId,
  proofType,
  label,
  description,
  existingUrl,
  disabled,
  onUploaded,
  uploadEndpoint = "/api/buyer/proofs/upload",
}: ProofUploadSlotProps) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("requestId", requestId);
      fd.append("proofType", proofType);
      fd.append("type", proofType);

      const res = await fetch(uploadEndpoint, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const msg = data?.error || "Upload failed";
        console.error("Proof upload error:", msg);
        setError(msg);
        return;
      }

      const url = data.url as string | undefined;
      if (url) onUploaded?.(url);
    } catch (err) {
      console.error(err);
      setError("Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 text-[11px] space-y-2">
      <div>
        <p className="font-medium text-neutral-100">{label}</p>
        <p className="text-neutral-400 mt-1">{description}</p>
      </div>

      {existingUrl ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-900/80 px-2.5 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/40 text-[11px] text-emerald-300">
              ✔
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-neutral-100 font-medium">
                File uploaded
              </p>
              <p className="text-[10px] text-neutral-500 truncate">
                <Link
                  href={existingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 decoration-neutral-600 hover:decoration-neutral-300"
                >
                  View / download proof
                </Link>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="rounded-lg border border-neutral-700 bg-neutral-900 hover:border-neutral-500 px-2.5 py-1 text-[10px] text-neutral-100 disabled:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Replace
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-2.5 py-1 text-[10px] text-neutral-600 cursor-not-allowed"
              title="Removal not enabled in Phase-1"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex h-9 w-full items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-900/40 text-[11px] text-neutral-300 hover:border-neutral-500 hover:text-neutral-50 disabled:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading…" : "Upload file"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleChange}
        disabled={disabled || uploading}
      />

      {error && <p className="text-[10px] text-red-300">⚠ {error}</p>}
    </div>
  );
}

export default function BuyerRequestDetailsPage() {
  const params = useParams();
  const pathname = usePathname();
  const id = params?.id as string | undefined;

  const [item, setItem] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [cancelLoading, setCancelLoading] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);

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

  // 🔴 UPDATED: use buyer cancel API, which writes proper buyer-ledger events
  async function handleCancel() {
    if (!item?.id) return;

    setCancelError(null);
    setCancelLoading(true);

    try {
      const res = await fetch("/api/buyer/requests/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: item.id,
          reason: "Buyer cancelled from buyer workspace (Phase-1).",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        console.error("Cancel error:", data?.error || res.statusText);
        setCancelError(
          data?.error || "Could not cancel the request. Please try again."
        );
        setCancelLoading(false);
        return;
      }

      setItem((prev: any) => ({
        ...prev,
        status: "CANCELLED",
      }));
    } catch (err) {
      console.error(err);
      setCancelError("Something went wrong. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-xs text-neutral-400">Loading request…</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <div className="text-center space-y-3 max-w-md">
          <p className="text-sm text-neutral-300">{error || "Unknown error."}</p>
          <Link
            href="/buyer"
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            ← Back to buyer dashboard
          </Link>
        </div>
      </div>
    );
  }

  const request = item;

  const rawCheckoutPrice =
    typeof request.checkoutPrice === "number"
      ? request.checkoutPrice
      : request.checkoutPrice != null
      ? Number(request.checkoutPrice)
      : null;

  const offerPercent =
    typeof request.offerPercent === "number"
      ? request.offerPercent
      : request.offerPercent != null
      ? Number(request.offerPercent) || 0
      : 0;

  const futureBenefitPercent =
    typeof request.futureBenefitPercent === "number"
      ? request.futureBenefitPercent
      : request.futureBenefitPercent != null
      ? Number(request.futureBenefitPercent) || 0
      : 0;

  const hasPricing =
    rawCheckoutPrice != null &&
    !Number.isNaN(rawCheckoutPrice) &&
    rawCheckoutPrice > 0;

  const pricing = hasPricing
    ? calculatePricing({
        checkoutPrice: rawCheckoutPrice as number,
        offerPercent,
        futureBenefitPercent,
        runesseCommissionPercent: 10, // 10% of total benefit for Phase-1
      })
    : null;

  const status = ((request?.status as string) || "PENDING")
    .toUpperCase() as RequestStatus;

  const createdAt = request?.createdAt ? new Date(request.createdAt) : null;
  const matchedAt = request?.matchedAt ? new Date(request.matchedAt) : null;
  const completedAt = request?.completedAt
    ? new Date(request.completedAt)
    : null;

  const buyerCheckoutUrl = getProofUrl(request, "buyer-checkout");
  const buyerProductUrl = getProofUrl(request, "buyer-product");
  const chInvoiceUrl = getProofUrl(request, "cardholder-invoice");
  const chCardProofUrl = getProofUrl(request, "cardholder-card-proof");

  const buyerUploadsLocked = status !== "PENDING";
  const readOnlyAfterComplete = status === "COMPLETED";

  const isCancellable =
    status === "PENDING" || status === "MATCHED" || status === "COMPLETED";

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="border-b border-neutral-900 bg-gradient-to-b from-black to-neutral-950/60">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/buyer"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-50 hover:border-neutral-600"
                aria-label="Back to buyer dashboard"
              >
                ←
              </Link>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">
                  Buyer workspace
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-medium text-neutral-50 truncate">
                    Request details
                  </h1>
                  <StatusBadge status={status} />
                </div>
                <p className="mt-0.5 text-[11px] text-neutral-500 truncate">
                  {request.productName || "No product name specified"}
                </p>
              </div>
            </div>

            {isCancellable && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelLoading || readOnlyAfterComplete}
                  className="inline-flex items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-[11px] font-medium text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {cancelLoading ? "Cancelling…" : "Cancel request"}
                </button>
              </div>
            )}
          </div>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px] text-neutral-500">
            {createdAt && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
                  ⏱
                </span>
                <span>
                  Created{" "}
                  <span className="text-neutral-300">
                    {createdAt.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </span>
              </div>
            )}

            {matchedAt && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
                  🤝
                </span>
                <span>
                  Matched{" "}
                  <span className="text-neutral-300">
                    {matchedAt.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </span>
              </div>
            )}

            {completedAt && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
                  ✅
                </span>
                <span>
                  Marked completed{" "}
                  <span className="text-neutral-300">
                    {completedAt.toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left */}
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
                      ₹{Number(request.checkoutPrice).toLocaleString("en-IN")}
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

            {/* Pricing summary */}
            {pricing && (
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="text-xs font-medium text-neutral-400 mb-1.5">
                      Pricing summary
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Based on the checkout price, card offer and a 10% Runesse
                      commission on the total benefit.
                    </p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  <div>
                    <dt className="text-neutral-500">Checkout price</dt>
                    <dd className="font-semibold text-neutral-100">
                      ₹{pricing.cardholderPayNow.toLocaleString("en-IN")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Total benefit</dt>
                    <dd className="font-semibold text-emerald-300">
                      ₹{pricing.totalBenefit.toLocaleString("en-IN")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Runesse commission</dt>
                    <dd className="font-semibold text-amber-300">
                      ₹{pricing.runesseCommission.toLocaleString("en-IN")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Your net saving</dt>
                    <dd className="font-semibold text-emerald-300">
                      ₹{pricing.buyerNetSaving.toLocaleString("en-IN")}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 border-t border-neutral-800/80 pt-2">
                  <p className="text-[11px] text-neutral-500 mb-1">
                    Suggested amount to deposit to Runesse
                  </p>
                  <p className="text-sm font-semibold text-neutral-50">
                    ₹{pricing.suggestedBuyerDeposit.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}

            {/* Buyer uploads */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Your proofs & attachments
              </p>
              <p className="text-[11px] text-neutral-500 mb-3">
                Upload your checkout and product screenshots. Uploads lock once a
                cardholder takes the request.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="buyer-checkout"
                  label="Checkout screenshot"
                  description="Final checkout page showing total amount and card offers."
                  disabled={buyerUploadsLocked}
                  existingUrl={buyerCheckoutUrl}
                  onUploaded={(url) =>
                    setItem((prev: any) => ({
                      ...prev,
                      buyerCheckoutScreenshotUrl: url,
                    }))
                  }
                />
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="buyer-product"
                  label="Product page / details"
                  description="Product details screenshot or PDF."
                  disabled={buyerUploadsLocked}
                  existingUrl={buyerProductUrl}
                  onUploaded={(url) =>
                    setItem((prev: any) => ({
                      ...prev,
                      buyerProductScreenshotUrl: url,
                    }))
                  }
                />
              </div>

              {buyerUploadsLocked && (
                <p className="mt-3 text-[10px] text-neutral-500">
                  Uploads are locked because this request is not PENDING.
                </p>
              )}
            </div>

            {/* Cardholder proofs read-only */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Cardholder proofs (read-only)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="cardholder-invoice"
                  label="Cardholder invoice"
                  description="Merchant invoice uploaded by cardholder."
                  disabled
                  existingUrl={chInvoiceUrl}
                />
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="cardholder-card-proof"
                  label="Card transaction proof"
                  description="Debit proof uploaded by cardholder."
                  disabled
                  existingUrl={chCardProofUrl}
                />
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-1.5">
                What happens next?
              </p>
              <ol className="mt-1 space-y-1.5 text-[11px] text-neutral-300">
                <li>
                  1. Upload your checkout and product screenshots so we can
                  verify the request.
                </li>
                <li>
                  2. A cardholder will take this request and upload their proof
                  of payment.
                </li>
                <li>
                  3. Once verified, you will record your deposit to Runesse and
                  the admin will mark this request as completed.
                </li>
              </ol>

              <div className="mt-3 pt-3 border-t border-neutral-900/70">
                <p className="text-[11px] text-neutral-500 mb-1">
                  Need to adjust something?
                </p>
                <p className="text-[11px] text-neutral-400">
                  You can cancel this request while it is still PENDING or
                  MATCHED. Once completed, it becomes read-only.
                </p>

                <div className="mt-3">
                  <Link
                    href={`/buyer/request/${request.id}/deposit`}
                    className="inline-flex items-center rounded-lg border border-emerald-500/50 bg-emerald-950/20 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/10"
                  >
                    Record deposit to Runesse
                  </Link>
                </div>

                {cancelError && (
                  <p className="mt-3 text-[10px] text-red-300">{cancelError}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
