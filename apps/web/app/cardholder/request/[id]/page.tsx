"use client";

import React from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

type RequestStatus = "PENDING" | "MATCHED" | "COMPLETED" | "CANCELLED" | string;
const DEMO_CARDHOLDER_EMAIL = "cardholder@demo.runesse";

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

  const [takeLoading, setTakeLoading] = React.useState(false);
  const [takeError, setTakeError] = React.useState<string | null>(null);

  // Card selection for "I can take this"
  const [selectForRequestId, setSelectForRequestId] = React.useState<string | null>(null);
  const [savedCards, setSavedCards] = React.useState<any[] | null>(null);
  const [selectedCardId, setSelectedCardId] = React.useState<string | null>(null);

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

  async function handleTakeRequest() {
    if (!item) return;

    setTakeError(null);
    setTakeLoading(false); // we only use takeLoading when confirming
    setSelectedCardId(null);
    setSavedCards(null);
    setSelectForRequestId(item.id);

    try {
      const res = await fetch("/api/cardholder/cards");
      const data = await res.json();

      if (!data?.ok) {
        throw new Error(data?.error || "Could not load your cards");
      }

      setSavedCards(data.cards || []);

      if (!data.cards || data.cards.length === 0) {
        setTakeError(
          "You do not have any saved cards yet. Please add a card in the 'Save my cards' page."
        );
      }
    } catch (err: any) {
      console.error(err);
      setTakeError(
        err?.message || "Failed to load your cards. Please try again."
      );
      setSavedCards([]);
    }
  }

    async function confirmTakeRequestWithCard() {
    if (!item || !selectForRequestId || !selectedCardId) {
      setTakeError("Please choose a card.");
      return;
    }

    try {
      setTakeLoading(true);
      setTakeError(null);

      const res = await fetch("/api/cardholder/requests/take-with-card", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: item.id,
          savedCardId: selectedCardId,
          cardholderEmail: DEMO_CARDHOLDER_EMAIL,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            "Could not take this request. It may have been taken already."
        );
      }

      // Update local state so UI changes to MATCHED
      setItem((prev: any) =>
        prev
          ? {
              ...prev,
              status: "MATCHED",
              matchedAt: new Date().toISOString(),
              matchedCardId: selectedCardId,
            }
          : prev
      );

      setSelectForRequestId(null);
      setSelectedCardId(null);
      setSavedCards(null);
    } catch (err: any) {
      console.error(err);
      setTakeError(
        err?.message || "Something went wrong. Please try again."
      );
    } finally {
      setTakeLoading(false);
    }
  }

  function closeCardSelector() {
    setSelectForRequestId(null);
    setSelectedCardId(null);
    setSavedCards(null);
    setTakeError(null);
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

  const cardholderUploadsLocked = status !== "MATCHED";
  const readOnlyAfterComplete = status === "COMPLETED";

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
            Back to my workspace
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
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
              <span>This request is matched to your card</span>
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
            </div>
          )}
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left side */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-5">
            {/* Product summary */}
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
                  Buyer&apos;s product link
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

            {/* Buyer proofs (read-only) */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Buyer proofs (read-only)
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            {/* Cardholder proofs */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Your proofs & attachments
              </p>
              <p className="text-[11px] text-neutral-500 mb-3">
                Upload the final merchant invoice and your card transaction
                proof. Uploads are enabled once you accept the request and it is
                in MATCHED status.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Right side */}
          <div className="space-y-4 sm:space-y-5">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 sm:p-5">
              <p className="text-xs font-medium text-neutral-400 mb-2">
                Status (cardholder)
              </p>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2.5 text-xs text-neutral-200 flex items-center justify-between">
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

              {status === "CANCELLED" && (
                <p className="mt-2 text-[11px] text-red-300">
                  This request has been cancelled.
                </p>
              )}

              {/* I can take this (PENDING) */}
              {status === "PENDING" && (
                <div className="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={handleTakeRequest}
                    disabled={takeLoading}
                    className="w-full rounded-lg border border-emerald-600/70 bg-emerald-900/40 px-3 py-1.5 text-[11px] font-medium text-emerald-200 hover:bg-emerald-800/60 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {takeLoading ? "Taking…" : "I can take this"}
                  </button>
                  {takeError && (
                    <p className="text-[10px] text-red-300 mt-1">{takeError}</p>
                  )}
                </div>
              )}

              {/* Cancel (MATCHED) */}
              {status === "MATCHED" && (
                <div className="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={handleCancelRequest}
                    disabled={cancelLoading}
                    className="w-full rounded-lg border border-red-600/60 bg-red-950/40 px-3 py-1.5 text-[11px] font-medium text-red-200 hover:bg-red-900/60 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {cancelLoading ? "Cancelling…" : "Cancel this request"}
                  </button>
                  {cancelError && (
                    <p className="text-[10px] text-red-300 mt-1">
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
              <p className="text-xs font-medium text-neutral-400 mb-1">
                Trust note
              </p>
              <p className="text-[11px] text-neutral-500">
                Phase-1 (manual): Runesse ensures safe reimbursement after your
                proofs are verified.
              </p>
            </div>
          </div>
        </div>
              {selectForRequestId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 px-4 py-5">
            <h2 className="text-sm font-semibold text-neutral-50">
              Choose card for this request
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              Select which saved card you will use to pay for this buyer&apos;s
              order.
            </p>

            {takeError && (
              <p className="mt-2 text-xs text-red-400">{takeError}</p>
            )}

            {!savedCards && !takeError && (
              <p className="mt-3 text-xs text-neutral-400">
                Loading your cards...
              </p>
            )}

            {savedCards && savedCards.length > 0 && (
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                {savedCards.map((card: any) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => setSelectedCardId(card.id)}
                    className={[
                      "w-full rounded-lg border px-3 py-2 text-left text-xs",
                      selectedCardId === card.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-neutral-700 bg-black/60 hover:border-neutral-500",
                    ].join(" ")}
                  >
                    <div className="font-medium text-neutral-100">
                      {card.label || `**** ${card.last4}`}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {[card.issuer, card.brand, card.network]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      BIN {card.bin} · **** {card.last4} ·{" "}
                      {card.country || "IN"}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCardSelector}
                className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmTakeRequestWithCard}
                disabled={takeLoading || !selectedCardId}
                className="rounded-full border border-emerald-500/70 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200 disabled:opacity-50"
              >
                {takeLoading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
