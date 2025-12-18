// apps/web/app/cardholder/request/[id]/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabaseClient";

type RequestStatus =
  | "SUBMITTED"
  | "ADMIN_APPROVED"
  | "MATCHED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED"
  | string;

function StatusBadge({ status }: { status: RequestStatus }) {
  const label = (status || "SUBMITTED").toUpperCase();

  let border = "border-neutral-700";
  let bg = "bg-neutral-900/80";
  let text = "text-neutral-100";
  let display = label;

  if (label === "SUBMITTED") {
    border = "border-amber-500/40";
    bg = "bg-amber-500/10";
    text = "text-amber-300";
    display = "Pending admin review";
  } else if (label === "ADMIN_APPROVED") {
    border = "border-sky-500/40";
    bg = "bg-sky-500/10";
    text = "text-sky-300";
    display = "Approved – visible to cardholders";
  } else if (label === "MATCHED") {
    border = "border-sky-500/40";
    bg = "bg-sky-500/10";
    text = "text-sky-300";
    display = "Matched with you";
  } else if (label === "COMPLETED") {
    border = "border-emerald-500/40";
    bg = "bg-emerald-500/10";
    text = "text-emerald-300";
    display = "Completed";
  } else if (label === "CANCELLED" || label === "REJECTED") {
    border = "border-red-500/40";
    bg = "bg-red-500/10";
    text = "text-red-300";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium ${border} ${bg} ${text}`}
    >
      {display}
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
    if (request[key]) return request[key];
  }

  if (request.proofs && request.proofs[proofType]?.url) {
    return request.proofs[proofType].url;
  }

  return null;
}

function fileNameFromUrl(url?: string | null) {
  if (!url) return "";
  try {
    const clean = url.split("?")[0];
    return clean.split("/").pop() || clean;
  } catch {
    return url;
  }
}

function ProofUploadSlot({
  requestId,
  proofType,
  label,
  description,
  disabled,
  existingUrl,
  onUploaded,
}: {
  requestId: string;
  proofType: ProofType;
  label: string;
  description: string;
  disabled?: boolean;
  existingUrl?: string | null;
  onUploaded?: (url: string) => void;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const uploadEndpoint =
    proofType.startsWith("buyer-")
      ? "/api/buyer/proofs/upload"
      : "/api/cardholder/proofs/upload";

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
    <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3.5 text-[11px]">
      <div>
        <p className="font-medium text-neutral-100">{label}</p>
        <p className="mt-1 text-neutral-400">{description}</p>
      </div>

      {existingUrl ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-950/60 px-2.5 py-2">
          <div className="min-w-0">
            <p className="truncate text-neutral-200">
              {fileNameFromUrl(existingUrl)}
            </p>
            <Link
              href={existingUrl}
              target="_blank"
              className="text-[10px] text-sky-400 hover:text-sky-300"
            >
              View file ↗
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="rounded-lg border border-neutral-700 bg-neutral-950/70 px-2.5 py-1 text-[10px] text-neutral-200 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Replace
            </button>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg border border-neutral-800 bg-neutral-950/80 px-2.5 py-1 text-[10px] text-neutral-600"
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
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-[11px] text-neutral-200 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
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

export default function CardholderRequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = (params?.id as string) || "";

  const [loading, setLoading] = React.useState(true);
  const [item, setItem] = React.useState<any | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [takeLoading, setTakeLoading] = React.useState(false);
  const [takeError, setTakeError] = React.useState<string | null>(null);

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
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;

        if (!token) {
          throw new Error("Not signed in.");
        }

        const res = await fetch(`/api/cardholder/requests/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.ok || !data?.request) {
          throw new Error(data?.error || "Could not load request details.");
        }

        setItem(data.request);
      } catch (e: any) {
        console.error("Failed to load request details", e);
        setError(e?.message || "Could not load this request.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);


  async function handleTakeRequest() {
    if (!item) return;

    const confirmed = window.confirm(
      "Do you want to take this request and become the cardholder for this purchase?"
    );
    if (!confirmed) return;

    setTakeError(null);
    setTakeLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;

      const res = await fetch("/api/cardholder/requests/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ requestId: item.id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            "Could not take this request. It may have been taken already."
        );
      }

      const updated = data.request || null;

      setItem((prev: any) =>
        prev
          ? {
              ...prev,
              status: updated?.status || "MATCHED",
              matchedAt:
                updated?.matchedAt || new Date().toISOString(),
              matchedCardholderEmail:
                updated?.matchedCardholderEmail ??
                prev?.matchedCardholderEmail,
              matchedCardId: updated?.matchedCardId ?? prev?.matchedCardId,
            }
          : prev
      );
    } catch (err: any) {
      console.error("Error accepting request", err);
      setTakeError(err?.message || "Could not take this request.");
    } finally {
      setTakeLoading(false);
    }
  }

  async function handleCancelRequest() {
    if (!item) return;
    if (!window.confirm("Do you really want to cancel this request?")) return;

    setCancelError(null);
    setCancelLoading(true);

    try {
      const res = await fetch("/api/cardholder/requests/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: item.id,
          reason: "Cancelled by cardholder from UI",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setCancelError(
          data?.error ||
            "Could not cancel the request. It may not be in MATCHED status."
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
      <div className="flex min-h-screen items-center justify-center bg-black text-neutral-100">
        <p className="text-xs text-neutral-400">Loading request…</p>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-neutral-100">
        <div className="max-w-md space-y-3 text-center">
          <p className="text-sm text-neutral-300">
            {error || "Unknown error."}
          </p>
          <Link
            href="/cardholder"
            className="text-xs text-sky-400 hover:text-sky-300"
          >
            ← Back to cardholder dashboard
          </Link>
        </div>
      </div>
    );
  }

  const request = item;
  const status = ((request?.status as string) || "SUBMITTED")
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

  const isAdminApproved =
    status === "ADMIN_APPROVED" && !request.matchedCardholderEmail;
  const isMatched = status === "MATCHED";
  const isCompleted = status === "COMPLETED";
  const isCancelled = status === "CANCELLED" || status === "REJECTED";

  const cardholderUploadsLocked = !isMatched;
  const readOnlyAfterComplete = isCompleted;

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            href="/cardholder"
            className="inline-flex items-center text-xs text-neutral-400 transition-colors hover:text-neutral-100 sm:text-sm"
          >
            <span className="mr-1 text-lg">←</span>
            Back to my workspace
          </Link>

          <StatusBadge status={status} />
        </div>

        <div className="mb-4">
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            CARDHOLDER • REQUEST DETAILS
          </p>
          <h1 className="text-xl font-semibold text-neutral-50 sm:text-2xl">
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
            <span className="hidden text-neutral-700 sm:inline">•</span>
            <span className="break-all text-neutral-600">
              Request ID: {request.id}
            </span>
          </div>

          {matchedAt && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
              <span>This request is matched to your card</span>
              <span className="hidden text-neutral-700 sm:inline">•</span>
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
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="space-y-4 sm:space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-400">
                    Product
                  </p>
                  <p className="text-sm text-neutral-50 sm:text-base">
                    {request.productName || "Not specified"}
                  </p>
                </div>

                {request.checkoutPrice != null && (
                  <div className="text-right">
                    <p className="mb-[2px] text-xs text-neutral-500">
                      Checkout price
                    </p>
                    <p className="text-base font-semibold text-neutral-50 sm:text-lg">
                      ₹{Number(request.checkoutPrice).toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-3 border-t border-neutral-800/80 pt-3">
                <p className="mb-1.5 text-xs font-medium text-neutral-400">
                  Buyer&apos;s product link
                </p>
                {request.productLink ? (
                  <Link
                    href={request.productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center break-all text-xs text-sky-400 hover:text-sky-300 sm:text-sm"
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

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="mb-2 text-xs font-medium text-neutral-400">
                Buyer delivery address (Phase-1)
              </p>

              {request.deliveryAddressText ? (
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-neutral-50 whitespace-pre-wrap">
                    {request.deliveryAddressText}
                  </p>

                  {request.deliveryMobile ? (
                    <p className="text-sm text-neutral-300">
                      Mobile: <span className="text-neutral-100">{request.deliveryMobile}</span>
                    </p>
                  ) : null}

                  <p className="text-xs text-neutral-500">
                    Visible only to the matched cardholder while status is MATCHED.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-neutral-400">
                  {String(request.status || "").toUpperCase() === "MATCHED"
                    ? "The buyer address will appear here only for the matched cardholder."
                    : "Buyer address is available only after you accept the request and while the status is MATCHED."}
                </p>
              )}
            </div>


            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="mb-2 text-xs font-medium text-neutral-400">
                Buyer proofs (read-only)
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="buyer-checkout"
                  label="Checkout screenshot"
                  description="Final checkout page uploaded by buyer."
                  disabled
                  existingUrl={buyerCheckoutUrl}
                />
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="buyer-product"
                  label="Product page / details"
                  description="Product details screenshot uploaded by buyer."
                  disabled
                  existingUrl={buyerProductUrl}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="mb-2 text-xs font-medium text-neutral-400">
                Your proofs & attachments
              </p>
              <p className="mb-3 text-[11px] text-neutral-500">
                Upload the final merchant invoice and your card transaction
                proof. Uploads are enabled once you accept the request and it is
                in MATCHED status.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="cardholder-invoice"
                  label="Merchant invoice"
                  description="Final invoice issued by the merchant."
                  disabled={cardholderUploadsLocked}
                  existingUrl={chInvoiceUrl}
                  onUploaded={(url) =>
                    setItem((prev: any) => ({
                      ...prev,
                      cardholderInvoiceUrl: url,
                    }))
                  }
                />
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="cardholder-card-proof"
                  label="Card transaction proof"
                  description="Screenshot or PDF showing amount debited on your card."
                  disabled={cardholderUploadsLocked}
                  existingUrl={chCardProofUrl}
                  onUploaded={(url) =>
                    setItem((prev: any) => ({
                      ...prev,
                      cardholderCardProofUrl: url,
                    }))
                  }
                />
              </div>

              {cardholderUploadsLocked && (
                <p className="mt-3 text-[10px] text-neutral-500">
                  Uploads are locked because this request is not in MATCHED
                  status.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="mb-2 text-xs font-medium text-neutral-400">
                Status (cardholder)
              </p>
              <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2.5 text-xs text-neutral-200">
                <span>Current status</span>
                <StatusBadge status={status} />
              </div>

              {completedAt && (
                <p className="mt-2 text-[11px] text-neutral-500">
                  Completed on{" "}
                  {completedAt.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              {isCancelled && (
                <p className="mt-2 text-[11px] text-red-300">
                  This request has been cancelled or rejected.
                </p>
              )}

              {isAdminApproved && (
                <div className="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={handleTakeRequest}
                    disabled={takeLoading}
                    className="w-full rounded-lg border border-emerald-600/70 bg-emerald-900/40 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-800/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {takeLoading ? "Taking…" : "I can take this"}
                  </button>
                  {takeError && (
                    <p className="mt-1 text-[10px] text-red-300">
                      {takeError}
                    </p>
                  )}
                </div>
              )}

              {isMatched && (
                <div className="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={handleCancelRequest}
                    disabled={cancelLoading}
                    className="w-full rounded-lg border border-red-600/60 bg-red-950/40 px-3 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-900/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelLoading ? "Cancelling…" : "Cancel this request"}
                  </button>
                  {cancelError && (
                    <p className="mt-1 text-[10px] text-red-300">
                      {cancelError}
                    </p>
                  )}
                </div>
              )}

              {readOnlyAfterComplete && (
                <p className="mt-2 text-[11px] text-neutral-500">
                  This trade is closed. Proofs are read-only now.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-4 sm:p-5">
              <p className="mb-1 text-xs font-medium text-neutral-400">
                Trust note
              </p>
              <p className="text-[11px] text-neutral-500">
                Phase-1 (manual): Runesse ensures safe reimbursement after your
                proofs are verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
