// apps/web/app/admin/ledger/page.tsx

import React from "react";
import Link from "next/link";
import { prisma } from "@runesse/db";

export const dynamic = "force-dynamic";

function formatDateTime(dt: Date) {
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Known event types we show in the dropdown
const KNOWN_EVENT_TYPES: string[] = [
  "REQUEST_CREATED",
  "REQUEST_UPDATED",
  "REQUEST_CANCELLED",
  "BUYER_PROOF_UPLOADED",
  "CARDHOLDER_PROOF_UPLOADED",
  "CARDHOLDER_ACCEPTED",
  "ADMIN_MARKED_COMPLETED",
  "ADMIN_REJECTED_REQUEST",
  "BUYER_DEPOSIT_CREATED",
  "BUYER_DEPOSIT_CONFIRMED",
  "CARDHOLDER_REIMBURSEMENT_CREATED",
  "CARDHOLDER_REIMBURSEMENT_CONFIRMED",
];

const eventLabels: Record<string, string> = {
  REQUEST_CREATED: "Request created",
  REQUEST_UPDATED: "Request updated",
  REQUEST_CANCELLED: "Request cancelled",

  BUYER_PROOF_UPLOADED: "Buyer proof uploaded",
  CARDHOLDER_PROOF_UPLOADED: "Cardholder proof uploaded",
  CARDHOLDER_ACCEPTED: "Cardholder accepted request",

  ADMIN_MARKED_COMPLETED: "Admin marked completed",
  ADMIN_REJECTED_REQUEST: "Admin cancelled request",

  BUYER_DEPOSIT_CREATED: "Buyer deposit created",
  BUYER_DEPOSIT_CONFIRMED: "Buyer deposit confirmed",

  CARDHOLDER_REIMBURSEMENT_CREATED: "Reimbursement created",
  CARDHOLDER_REIMBURSEMENT_CONFIRMED: "Reimbursement confirmed",
};

const eventBadgeClasses: Record<string, string> = {
  REQUEST_CREATED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
  REQUEST_UPDATED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
  REQUEST_CANCELLED: "bg-red-500/10 text-red-300 border-red-500/40",

  BUYER_PROOF_UPLOADED: "bg-sky-500/10 text-sky-300 border-sky-500/40",
  CARDHOLDER_PROOF_UPLOADED:
    "bg-amber-500/10 text-amber-300 border-amber-500/40",
  CARDHOLDER_ACCEPTED:
    "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",

  ADMIN_MARKED_COMPLETED:
    "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
  ADMIN_REJECTED_REQUEST: "bg-red-500/10 text-red-300 border-red-500/40",

  BUYER_DEPOSIT_CREATED: "bg-sky-500/10 text-sky-300 border-sky-500/40",
  BUYER_DEPOSIT_CONFIRMED: "bg-sky-500/10 text-sky-300 border-sky-500/40",

  CARDHOLDER_REIMBURSEMENT_CREATED:
    "bg-amber-500/10 text-amber-300 border-amber-500/40",
  CARDHOLDER_REIMBURSEMENT_CONFIRMED:
    "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
};

function getBadgeClasses(eventType: string) {
  return (
    eventBadgeClasses[eventType] ||
    "bg-neutral-800/80 text-neutral-200 border-neutral-600/60"
  );
}

// Try to figure out which Request this ledger row belongs to.
function getLinkedRequestId(entry: any): string | null {
  if (entry.referenceType === "REQUEST" && entry.referenceId) {
    return entry.referenceId as string;
  }

  const meta = (entry.meta || {}) as any;

  if (typeof meta.requestId === "string") return meta.requestId;
  if (typeof meta.buyerRequestId === "string") return meta.buyerRequestId;
  if (meta.request && typeof meta.request.id === "string") {
    return meta.request.id;
  }

  return null;
}

export default async function AdminLedgerPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const rawRequestId = searchParams?.requestId;
  const rawEventType = searchParams?.eventType;

  const requestFilter =
    typeof rawRequestId === "string" ? rawRequestId.trim() : "";
  const eventTypeFilter =
    typeof rawEventType === "string" ? rawEventType.trim() : "";

  // --- Build Prisma "where" based on filters (matches /api/admin/requests/[id]/ledger) ---
  const where: any = {};

  if (eventTypeFilter) {
    where.eventType = eventTypeFilter;
  }

  if (requestFilter) {
    // Same logic as the per-request ledger API:
    // 1) entries where referenceType = REQUEST and referenceId = requestId
    // 2) entries where referenceType = PROOF_UPLOAD and meta.requestId = requestId
    where.OR = [
      {
        referenceType: "REQUEST",
        referenceId: requestFilter,
      },
      {
        referenceType: "PROOF_UPLOAD",
        meta: {
          path: ["requestId"],
          equals: requestFilter,
        } as any,
      },
    ];
  }

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-black text-neutral-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-8">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
              Ledger
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              System-wide audit trail of requests, proofs, and admin actions.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900"
          >
            ← Back to admin dashboard
          </Link>
        </header>

        {/* Filters */}
        <section className="rounded-3xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 shadow-lg shadow-black/40 md:px-6">
          <form className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4">
            {/* Request ID filter */}
            <div className="flex-1">
              <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
                Request ID
              </label>
              <input
                type="text"
                name="requestId"
                defaultValue={requestFilter}
                placeholder="cmigam9n4000i5xe7mqrqvdkg"
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-600/40"
              />
              <p className="mt-1 text-[11px] text-neutral-500">
                Optional. Leave empty to see all requests.
              </p>
            </div>

            {/* Event type filter */}
            <div className="w-full md:w-56">
              <label className="block text-xs font-medium uppercase tracking-wide text-neutral-400">
                Event type
              </label>
              <select
                name="eventType"
                defaultValue={eventTypeFilter}
                className="mt-1 w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none ring-0 focus:border-sky-500 focus:ring-2 focus:ring-sky-600/40"
              >
                <option value="">All events</option>
                {KNOWN_EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {eventLabels[t] ?? t}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex w-full flex-row gap-2 md:w-40 md:flex-col">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500"
              >
                APPLY FILTERS
              </button>
              <Link
                href="/admin/ledger"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900"
              >
                Clear
              </Link>
            </div>
          </form>
        </section>

        {/* Results */}
        <section className="rounded-3xl border border-neutral-800 bg-neutral-950/60 px-4 py-4 shadow-lg shadow-black/40 md:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-neutral-200">
                Latest events
              </h2>
              <p className="text-xs text-neutral-500">
                Showing up to 100 entries
                {requestFilter && (
                  <>
                    {" "}
                    for request{" "}
                    <span className="font-mono text-neutral-300">
                      {requestFilter}
                    </span>
                  </>
                )}
                {eventTypeFilter && (
                  <>
                    {" "}
                    filtered by{" "}
                    <span className="font-mono text-neutral-300">
                      {eventLabels[eventTypeFilter] ?? eventTypeFilter}
                    </span>
                    .
                  </>
                )}
              </p>
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-500">
              No ledger entries found for the selected filters.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => {
                const label =
                  eventLabels[entry.eventType] ??
                  entry.eventType ??
                  "Event";
                const badgeClasses = getBadgeClasses(entry.eventType);
                const createdAt = formatDateTime(entry.createdAt);
                const requestId = getLinkedRequestId(entry);

                return (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 rounded-2xl border border-neutral-850 bg-neutral-950/80 px-3 py-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${badgeClasses}`}
                        >
                          {label}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {entry.scope} • {entry.eventType}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400">
                        {entry.description || "No description"}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        ID: {entry.id} • {createdAt}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {requestId ? (
                        <Link
                          href={`/admin/request/${requestId}`}
                          className="inline-flex items-center rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1.5 text-[11px] text-neutral-100 hover:border-sky-500 hover:text-sky-300"
                        >
                          View request →
                        </Link>
                      ) : (
                        <span className="text-[11px] text-neutral-600">
                          No linked request
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
