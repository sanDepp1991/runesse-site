// apps/web/app/buyer/request/[id]/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { calculatePricing } from "../../../lib/pricing";

type RequestStatus =
  | "SUBMITTED"
  | "ADMIN_APPROVED"
  | "MATCHED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | string;

function StatusBadge({ status }: { status: RequestStatus }) {
  const label = (status || "SUBMITTED").toUpperCase();

  let border = "border-neutral-700";
  let bg = "bg-neutral-900/80";
  let text = "text-neutral-100";

  // Phase-1 request lifecycle:
  // SUBMITTED -> ADMIN_APPROVED -> MATCHED -> COMPLETED (or REJECTED/CANCELLED)
  if (label === "SUBMITTED") {
    border = "border-amber-500/40";
    bg = "bg-amber-950/40";
    text = "text-amber-200";
  } else if (label === "ADMIN_APPROVED") {
    border = "border-sky-500/40";
    bg = "bg-sky-950/40";
    text = "text-sky-200";
  } else if (label === "MATCHED") {
    border = "border-sky-500/40";
    bg = "bg-sky-950/40";
    text = "text-sky-200";
  } else if (label === "COMPLETED") {
    border = "border-emerald-500/40";
    bg = "bg-emerald-950/40";
    text = "text-emerald-200";
  } else if (label === "REJECTED" || label === "CANCELLED") {
    border = "border-red-500/40";
    bg = "bg-red-950/40";
    text = "text-red-200";
  }

  const display =
    label === "SUBMITTED"
      ? "SUBMITTED"
      : label === "ADMIN_APPROVED"
      ? "APPROVED"
      : label;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-[3px] text-[10px] font-medium ${border} ${bg} ${text}`}
    >
      {display}
    </span>
  );
}

// Safe formatter to avoid "cannot read 'toLocaleString'" errors
function formatINR(
  value: number | null | undefined,
  fractionDigits: number = 0
): string {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value.toLocaleString("en-IN", {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    });
  }
  return "—";
}

type ProofType =
  | "buyer-checkout"
  | "buyer-product"
  | "cardholder-invoice"
  | "cardholder-card-proof";

function getProofUrl(request: any, proofType: ProofType): string | null {
  const map: Record<ProofType, string[]> = {
    "buyer-checkout": [
      "buyerCheckoutScreenshotUrl",
      "buyerCheckoutUrl",
      "buyerCheckoutProofUrl",
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
  const [justUploaded, setJustUploaded] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setUploading(true);
      setError(null);
      setJustUploaded(false);

      const fd = new FormData();
      fd.append("file", file);
      fd.append("requestId", requestId);
      fd.append("proofType", proofType);
      fd.append("type", proofType);

      const res = await fetch(uploadEndpoint, {
        method: "POST",
        body: fd,
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.ok) {
        console.error("Upload failed:", data);
        setError(
          data?.error || data?.message || "Upload failed. Please try again."
        );
        return;
      }

      const url = data.url as string | undefined;
      if (url) {
        onUploaded?.(url);
      }

      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 4000);
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
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-2.5 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400 text-[11px] text-emerald-100">
              ✔
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-neutral-100 font-medium">
                File uploaded
              </p>
              <a
                href={existingUrl}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-[10px] text-neutral-300 underline decoration-dotted"
              >
                Open uploaded file
              </a>
              {justUploaded && (
                <p className="mt-1 text-[10px] text-emerald-300">
                  Upload successful.
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            disabled
            className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-2.5 py-1 text-[10px] text-neutral-600 cursor-not-allowed"
            title="Removal not enabled in Phase-1"
          >
            Remove
          </button>
        </div>
      ) : disabled ? (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-2.5 py-2 text-[10px] text-neutral-400">
          Uploads are disabled for this request status.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-[10px] font-medium text-neutral-100 hover:border-neutral-500 hover:bg-neutral-900">
              <span>{uploading ? "Uploading…" : "Choose file"}</span>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
            {uploading && (
              <p className="text-[10px] text-neutral-400">
                Please wait, uploading…
              </p>
            )}
          </div>
          {error && (
            <p className="text-[10px] text-red-300 truncate">{error}</p>
          )}
          {justUploaded && !error && (
            <p className="text-[10px] text-emerald-300">Upload successful.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuyerRequestDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [request, setItem] = React.useState<any | null>(null);
  const [updating, setUpdating] = React.useState(false);
  const [cancelError, setCancelError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    if (!id) return;

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

  async function handleCancel() {
    if (!request?.id) return;

    try {
      setUpdating(true);
      setCancelError(null);
      setSuccessMessage(null);

      const res = await fetch("/api/buyer/requests/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error || "Failed to cancel the request. Please try again."
        );
      }

      setItem((prev: any) => (prev ? { ...prev, status: "CANCELLED" } : prev));
      setSuccessMessage("Your request has been cancelled.");
    } catch (err: any) {
      console.error("[BuyerRequestDetailPage] cancel error", err);
      setCancelError(
        err?.message || "Unable to cancel this request right now."
      );
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Loading request…</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 max-w-sm text-center">
          <p className="text-sm font-medium text-red-100">{error}</p>
          <p className="mt-1 text-xs text-red-200/80">
            Try going back to the buyer dashboard and opening the request again.
          </p>
          <div className="mt-3">
            <Link
              href="/buyer"
              className="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-100 hover:bg-red-500/20"
            >
              Back to buyer dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status: RequestStatus = request.status || "SUBMITTED";

  const createdAt = request?.createdAt ? new Date(request.createdAt) : null;
  const matchedAt = request?.matchedAt ? new Date(request.matchedAt) : null;
  const completedAt = request?.completedAt ? new Date(request.completedAt) : null;

  const buyerCheckoutUrl = getProofUrl(request, "buyer-checkout");
  const buyerProductUrl = getProofUrl(request, "buyer-product");
  const chInvoiceUrl = getProofUrl(request, "cardholder-invoice");
  const chCardProofUrl = getProofUrl(request, "cardholder-card-proof");

  const buyerUploadsLocked =
    status === "COMPLETED" || status === "CANCELLED" || status === "REJECTED";
  const isCancellable =
    status === "SUBMITTED" || status === "ADMIN_APPROVED" || status === "MATCHED";

  const pricing =
    typeof request.checkoutPrice === "number"
      ? calculatePricing({
          checkoutPrice: request.checkoutPrice,
          offerPercent: request.offerPercent ?? 10,
          futureBenefitPercent: request.futureBenefitPercent ?? 0,
          runesseCommissionPercent: 10,
        })
      : null;

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
                <p className="text-xs font-medium text-neutral-400">
                  Buyer · Request
                </p>
                <div className="flex items-center gap-2">
                  {(status === "SUBMITTED" ||
                    status === "ADMIN_APPROVED" ||
                    status === "MATCHED") && (
                    <Link
                      href={`/buyer/request/${id}/deposit`}
                      className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-50 hover:bg-emerald-500/20"
                      title="Phase-1 manual: pay to Runesse current account and record your deposit"
                    >
                      Pay now / record deposit
                    </Link>
                  )}

                  <h1 className="truncate text-sm font-semibold text-neutral-50">
                    {request.productName || "Untitled product"}
                  </h1>
                  <StatusBadge status={status} />
                </div>
                {createdAt && (
                  <p className="mt-0.5 text-[10px] text-neutral-500">
                    Created{" "}
                    {createdAt.toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isCancellable && (
                <button
                  onClick={handleCancel}
                  disabled={updating}
                  className="inline-flex items-center rounded-full border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-50 hover:bg-red-500/20 disabled:opacity-60"
                >
                  {updating ? "Cancelling…" : "Cancel request"}
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px] text-neutral-500">
            {createdAt && (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
                  ⏱
                </span>
                <span>
                  Request created{" "}
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

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-7">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-neutral-300">
                    Product details
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    These are captured from your original request.
                  </p>
                </div>
                {request.productLink && (
                  <a
                    href={request.productLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-[11px] text-neutral-50 hover:border-neutral-500 hover:bg-neutral-800"
                  >
                    Open product page
                  </a>
                )}
              </div>

              <div className="space-y-2.5 text-[11px]">
                <div>
                  <p className="text-neutral-400">Product</p>
                  <p className="text-neutral-100">
                    {request.productName || "Not provided"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-neutral-400">Checkout price</p>
                    <p className="text-neutral-100">
                      {typeof request.checkoutPrice === "number"
                        ? `₹${formatINR(request.checkoutPrice)}`
                        : "Not captured"}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Requested card</p>
                    <p className="text-neutral-100">
                      {request.requestedIssuer || "Any bank"} ·{" "}
                      {request.requestedNetwork || "Any network"}
                      {request.requestedCardLabel
                        ? ` · ${request.requestedCardLabel}`
                        : ""}
                    </p>
                  </div>
                </div>
                {request.notes && (
                  <div>
                    <p className="text-neutral-400">Notes</p>
                    <p className="text-neutral-100 whitespace-pre-wrap">
                      {request.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {pricing && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-emerald-200">
                    With and without Runesse
                  </p>
                  <p className="text-[10px] text-emerald-200/80">
                    Rough illustration based on the offer inputs
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  <div>
                    <dt className="text-neutral-200">You pay now</dt>
                    <dd className="font-semibold text-neutral-50">
                      ₹{formatINR(pricing.suggestedBuyerDeposit)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-200">Cardholder pays now</dt>
                    <dd className="font-semibold text-neutral-50">
                      ₹{formatINR(pricing.cardholderPayNow)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-200">Total benefit</dt>
                    <dd className="font-semibold text-emerald-300">
                      ₹{formatINR(pricing.totalBenefit)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-200">Runesse commission</dt>
                    <dd className="font-semibold text-amber-300">
                      ₹{formatINR(pricing.runesseCommission)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-neutral-200">Your net saving</dt>
                    <dd className="font-semibold text-emerald-300">
                      ₹{formatINR(pricing.buyerNetSaving)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 border-t border-neutral-800/80 pt-2">
                  <p className="text-[11px] text-neutral-200 mb-1">
                    Suggested amount to deposit to Runesse
                  </p>
                  <p className="text-[13px] font-semibold text-neutral-50">
                    ₹{formatINR(pricing.suggestedBuyerDeposit)}
                  </p>
                  <p className="mt-1 text-[10px] text-neutral-400">
                    This is just an illustration of how the flows will work
                    once escrow is enabled. In Phase-1, payments happen outside
                    Runesse.
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-neutral-300">
                    Your uploads
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Add proof so the cardholder and admin can verify the
                    transaction.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="buyer-checkout"
                  label="Checkout screenshot"
                  description="Final checkout page showing total amount and card offers."
                  disabled={buyerUploadsLocked}
                  existingUrl={buyerCheckoutUrl}
                  onUploaded={(url) =>
                    setItem((prev: any) =>
                      prev
                        ? {
                            ...prev,
                            buyerCheckoutScreenshotUrl: url,
                          }
                        : prev
                    )
                  }
                />

                <ProofUploadSlot
                  requestId={request.id}
                  proofType="buyer-product"
                  label="Product screenshot (optional)"
                  description="Product page screenshot with price and offer section."
                  disabled={buyerUploadsLocked}
                  existingUrl={buyerProductUrl}
                  onUploaded={(url) =>
                    setItem((prev: any) =>
                      prev
                        ? {
                            ...prev,
                            buyerProductScreenshotUrl: url,
                          }
                        : prev
                    )
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5 space-y-3.5">
              <p className="text-xs font-medium text-neutral-300">
                Cardholder uploads
              </p>
              <p className="text-[11px] text-neutral-500">
                These files are uploaded by the cardholder to prove purchase.
              </p>

              <div className="space-y-3">
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

          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5 min-h-[220px]">
              <p className="text-xs font-medium text-neutral-300">
                Status timeline
              </p>
              <div className="mt-3 space-y-2.5 text-[11px] text-neutral-300">
                {createdAt && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
                      ⏱
                    </span>
                    <span>
                      Request created{" "}
                      <span className="text-neutral-400">
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
                      Cardholder matched{" "}
                      <span className="text-neutral-400">
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
                      <span className="text-neutral-400">
                        {completedAt.toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </span>
                  </div>
                )}

                {!completedAt && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-neutral-800 bg-neutral-950">
                      …
                    </span>
                    <span className="text-neutral-400">
                      Waiting for uploads and admin verification.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5 min-h-[220px] text-[11px]">
              <p className="text-xs font-medium text-neutral-300">
                How this works
              </p>
              <ol className="mt-2 list-decimal pl-4 space-y-1.5 text-neutral-300">
                <li>Upload your checkout proof and (optionally) product page.</li>
                <li>
                  A cardholder uses their offer card and uploads invoice and card
                  transaction proof.
                </li>
                <li>Admin verifies everything and marks the request completed.</li>
              </ol>
              <p className="mt-3 text-[10px] text-neutral-500">
                In Phase-1, payments happen outside Runesse. We only help you
                coordinate proofs and keep an audit trail of each step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
