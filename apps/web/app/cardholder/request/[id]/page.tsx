"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

type RequestStatus =
  | "PENDING"
  | "MATCHED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

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

type ProofType =
  | "buyer-checkout"
  | "buyer-product"
  | "cardholder-invoice"
  | "cardholder-card-proof"
  | "ch-invoice"
  | "ch-card-proof"
  | "CARDHOLDER_INVOICE"
  | "CARD_TRANSACTION_PROOF";

function normalizeProofType(
  pt: ProofType | string
): "buyer-checkout" | "buyer-product" | "cardholder-invoice" | "cardholder-card-proof" {
  const raw = String(pt || "").trim();

  if (raw === "CARDHOLDER_INVOICE") return "cardholder-invoice";
  if (raw === "CARD_TRANSACTION_PROOF") return "cardholder-card-proof";
  if (raw === "ch-invoice") return "cardholder-invoice";
  if (raw === "ch-card-proof") return "cardholder-card-proof";

  if (raw === "buyer-checkout") return "buyer-checkout";
  if (raw === "buyer-product") return "buyer-product";
  if (raw === "cardholder-invoice") return "cardholder-invoice";
  if (raw === "cardholder-card-proof") return "cardholder-card-proof";

  const lowered = raw.toLowerCase().replace(/_/g, "-");
  if (lowered.includes("invoice")) return "cardholder-invoice";
  if (lowered.includes("card") && lowered.includes("proof"))
    return "cardholder-card-proof";

  return "cardholder-invoice";
}

function getProofUrl(request: any, proofType: ProofType): string | null {
  if (!request) return null;

  const map: Record<string, string[]> = {
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

  const normalized = normalizeProofType(proofType);
  for (const key of map[normalized] || []) {
    if (request[key]) return request[key];
  }

  if (request.proofs && request.proofs[normalized]?.url) {
    return request.proofs[normalized].url;
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

  const normalizedType = normalizeProofType(proofType);

  const uploadEndpoint =
    normalizedType.startsWith("buyer-")
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
      fd.append("proofType", normalizedType);
      fd.append("type", normalizedType);

      const res = await fetch(uploadEndpoint, {
        method: "POST",
        body: fd,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const msg = data?.error || "Upload failed";
        console.error("Cardholder proof upload error:", msg);
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
        <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 bg-neutral-950/60 px-2.5 py-2">
          <div className="min-w-0">
            <p className="text-neutral-200 truncate">
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

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
              className="rounded-lg border border-neutral-700 bg-neutral-950/70 px-2.5 py-1 text-[10px] text-neutral-200 hover:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed"
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
          className="w-full rounded-lg border border-neutral-800 bg-neutral-950/70 px-3 py-2 text-[11px] text-neutral-200 hover:bg-neutral-900 disabled:opacity-60 disabled:cursor-not-allowed"
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

  const [isTaking, setIsTaking] = React.useState(false);
  const [takeError, setTakeError] = React.useState<string | null>(null);

  async function refreshOne(requestId: string) {
    const res = await fetch("/api/requests/list");
    const data = await res.json();
    const found = data?.requests?.find((r: any) => r.id === requestId);
    if (found) setItem(found);
  }

  async function handleTakeRequest() {
    if (!item?.id) return;
    setIsTaking(true);
    setTakeError(null);

    try {
      // ✅ CHANGE THIS URL ONLY IF YOUR ENDPOINT IS DIFFERENT
      const res = await fetch("/api/cardholder/requests/take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: item.id }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setTakeError(data?.error || "Could not take request");
        return;
      }

      await refreshOne(item.id);
    } catch (e) {
      console.error(e);
      setTakeError("Could not take request");
    } finally {
      setIsTaking(false);
    }
  }

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
  const status = ((request?.status as string) || "PENDING").toUpperCase();

  const createdAt = request?.createdAt ? new Date(request.createdAt) : null;
  const matchedAt = request?.matchedAt ? new Date(request.matchedAt) : null;

  const buyerCheckoutUrl = getProofUrl(request, "buyer-checkout");
  const buyerProductUrl = getProofUrl(request, "buyer-product");
  const chInvoiceUrl = getProofUrl(request, "cardholder-invoice");
  const chCardProofUrl = getProofUrl(request, "cardholder-card-proof");

  const cardholderUploadsLocked = status !== "MATCHED";

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/cardholder"
            className="inline-flex items-center text-xs sm:text-sm text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <span className="mr-1 text-lg">←</span>
            Back to cardholder workspace
          </Link>

          <StatusBadge status={status} />
        </div>

        {/* Header */}
        <div className="mb-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500 mb-2">
            CARDHOLDER • REQUEST DETAILS
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

          {matchedAt && (
            <div className="mt-2 text-[11px] text-neutral-300">
              Matched on{" "}
              {matchedAt.toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* Buyer proofs read-only */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Buyer proofs (read-only)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="buyer-checkout"
                  label="Checkout screenshot"
                  description="Buyer’s final checkout proof."
                  disabled
                  existingUrl={buyerCheckoutUrl}
                />
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="buyer-product"
                  label="Product page / details"
                  description="Buyer’s product proof."
                  disabled
                  existingUrl={buyerProductUrl}
                />
              </div>
            </div>

            {/* Cardholder uploads */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Your proofs & attachments
              </p>
              <p className="text-[11px] text-neutral-500 mb-3">
                Upload your merchant invoice and debit proof. Uploads are allowed
                only when the request is MATCHED.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ProofUploadSlot
                  requestId={request.id}
                  proofType="cardholder-invoice"
                  label="Cardholder invoice"
                  description="Final merchant invoice that admin will verify."
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
                  description="Statement/SMS/app screenshot showing debit."
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
                  Uploads are locked until the request becomes MATCHED.
                </p>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4 sm:space-y-5">

            {/* ✅ I CAN TAKE THIS block */}
            {status === "PENDING" && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
                <p className="text-xs font-medium text-amber-200 mb-1">
                  This request is available
                </p>
                <p className="text-[11px] text-amber-200/70 mb-3">
                  If you want to pay using your selected card, take this request.
                  The buyer’s uploads are visible above.
                </p>

                <button
                  type="button"
                  onClick={handleTakeRequest}
                  disabled={isTaking}
                  className="w-full rounded-xl bg-amber-500 text-black text-sm font-semibold py-2.5 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isTaking ? "Taking request..." : "I can take this"}
                </button>

                {takeError && (
                  <p className="mt-2 text-[11px] text-red-300">
                    ⚠ {takeError}
                  </p>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Status (cardholder)
              </p>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2.5 text-xs text-neutral-200 flex items-center justify-between">
                <span>Current status</span>
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-1">
                Trust note
              </p>
              <p className="text-[11px] text-neutral-500">
                Phase-1 (manual): Runesse ensures safe reimbursement after your proof is verified.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
