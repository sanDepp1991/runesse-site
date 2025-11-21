"use client";

import Link from "next/link";
import React from "react";

const BuyerPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800 bg-black/80 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl border border-neutral-700 flex items-center justify-center text-xs font-semibold tracking-widest">
              R
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Runesse</span>
              <span className="text-[11px] text-neutral-400">
                Buyer workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-neutral-300">
              Signed in as{" "}
              <span className="font-medium text-neutral-100">
                your-email@example.com
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 bg-black">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          {/* Welcome section */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                  Buyer • Runesse
                </p>
                <h1 className="mt-2 text-xl font-semibold sm:text-2xl">
                  Start a new request in a few clicks.
                </h1>
                <p className="mt-2 text-sm text-neutral-300 max-w-xl">
                  Create a request, upload product details and (later) proof.
                  Card holders with matching offers can pick it up, and Runesse
                  keeps everything verifiable.
                </p>
              </div>

              <Link
                href="/buyer/request/new"
                className="mt-2 inline-flex items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-400 transition"
              >
                + New request
              </Link>
            </div>
          </section>

          {/* 3 Columns */}
          <section className="grid gap-4 md:grid-cols-3">
            {/* Quick actions */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
              <h2 className="text-sm font-semibold">Quick actions</h2>
              <p className="text-xs text-neutral-400">
                These will soon open real flows. For now, they are placeholders.
              </p>

              <div className="space-y-2 pt-2">
                <button className="w-full rounded-lg border border-neutral-700 px-3 py-2 text-xs text-left hover:bg-neutral-800 transition">
                  New request for a single product
                </button>
                <button className="w-full rounded-lg border border-neutral-700 px-3 py-2 text-xs text-left hover:bg-neutral-800 transition">
                  New request with multiple items
                </button>
                <button className="w-full rounded-lg border border-neutral-700 px-3 py-2 text-xs text-left hover:bg-neutral-800 transition">
                  View sample request flow
                </button>
              </div>
            </div>

            {/* My Requests – enhanced with status */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
              <h2 className="text-sm font-semibold mb-1">My requests</h2>
              <p className="text-xs text-neutral-400 mb-3">
                Your recent requests with live status.
              </p>

              <MyRequestsList />
            </div>

            {/* Available Cards */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
              <h2 className="text-sm font-semibold mb-1">Available cards</h2>
              <p className="text-xs text-neutral-400 mb-3">
                Cardholder module is coming soon.
              </p>

              <div className="flex-1 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 flex items-center justify-center px-3 py-6">
                <div className="text-center space-y-1">
                  <p className="text-xs text-neutral-400">No cards yet.</p>
                  <p className="text-[11px] text-neutral-500">
                    This will update once cardholders add their cards.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

type NewRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | string;

function statusPillClasses(status: NewRequestStatus) {
  const s = (status || "PENDING").toUpperCase();

  if (s === "PENDING") {
    return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
  }
  if (s === "APPROVED" || s === "MATCHED" || s === "COMPLETED") {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
  }
  if (s === "REJECTED" || s === "CANCELLED") {
    return "bg-red-500/10 text-red-300 border border-red-500/40";
  }
  return "bg-neutral-800/70 text-neutral-200 border border-neutral-700";
}

function statusLabel(status: NewRequestStatus) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "APPROVED") return "Approved";
  if (s === "MATCHED") return "Matched";
  if (s === "COMPLETED") return "Completed";
  if (s === "REJECTED") return "Rejected";
  if (s === "CANCELLED") return "Cancelled";
  return s;
}

function statusSubtitle(status: NewRequestStatus) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "PENDING") {
    return "Waiting for a cardholder to pick this.";
  }
  if (s === "APPROVED") {
    return "Approved by admin. Cardholder step next.";
  }
  if (s === "MATCHED") {
    return "A cardholder has picked this request.";
  }
  if (s === "COMPLETED") {
    return "Deal completed and verified.";
  }
  if (s === "REJECTED") {
    return "This request was rejected.";
  }
  if (s === "CANCELLED") {
    return "This request has been cancelled.";
  }
  return "";
}

function MyRequestsList() {
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/requests/list");
        const data = await res.json();
        if (data?.ok && Array.isArray(data.requests)) {
          setItems(data.requests);
        }
      } catch (e) {
        console.error("Failed to load requests", e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-neutral-500">
        Loading…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex-1 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 flex items-center justify-center px-3 py-6">
        <div className="text-center">
          <p className="text-xs text-neutral-400">No requests yet.</p>
          <p className="mt-1 text-[11px] text-neutral-500">
            Start with “+ New request”.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
      {items.map((req: any) => {
        const createdAt = req.createdAt ? new Date(req.createdAt) : null;
        const pillClass = statusPillClasses(req.status as NewRequestStatus);

        return (
          <Link
            key={req.id}
            href={`/buyer/request/${req.id}`}
            className="block rounded-lg border border-neutral-700 bg-black/60 px-3 py-2.5 text-xs hover:bg-neutral-900 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-neutral-100 font-medium truncate">
                  {req.productName || "Unnamed product"}
                </p>
                {req.status && (
                  <p className="mt-0.5 text-[11px] text-neutral-500 truncate">
                    {statusSubtitle(req.status as NewRequestStatus)}
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-neutral-500 truncate">
                  {req.productLink}
                </p>
              </div>

              {req.status && (
                <span
                  className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium whitespace-nowrap ${pillClass}`}
                >
                  {statusLabel(req.status as NewRequestStatus)}
                </span>
              )}
            </div>

            <div className="mt-1.5 flex justify-between text-[11px] text-neutral-500">
              <span>
                {req.checkoutPrice != null
                  ? `₹${Number(req.checkoutPrice).toLocaleString("en-IN")}`
                  : "—"}
              </span>
              {createdAt && (
                <span>
                  {createdAt.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "2-digit",
                  })}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default BuyerPage;
