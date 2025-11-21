"use client";

import React from "react";
import Link from "next/link";

type RequestStatus =
  | "PENDING"
  | "MATCHED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

function statusPillClasses(status: RequestStatus) {
  const s = (status || "PENDING").toUpperCase();

  if (s === "PENDING") {
    return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
  }
  if (s === "MATCHED") {
    return "bg-sky-500/10 text-sky-300 border border-sky-500/40";
  }
  if (s === "COMPLETED") {
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
  }
  if (s === "CANCELLED") {
    return "bg-red-500/10 text-red-300 border border-red-500/40";
  }
  return "bg-neutral-800/70 text-neutral-200 border border-neutral-700";
}

function statusLabel(status: RequestStatus) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "PENDING") return "Pending";
  if (s === "MATCHED") return "Matched";
  if (s === "COMPLETED") return "Completed";
  if (s === "CANCELLED") return "Cancelled";
  return s;
}

function statusSubtitleForAdmin(status: RequestStatus) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "PENDING") {
    return "Waiting for a cardholder to pick this request.";
  }
  if (s === "MATCHED") {
    return "Cardholder picked this – admin to verify proofs & complete.";
  }
  if (s === "COMPLETED") {
    return "Marked completed after admin verification.";
  }
  if (s === "CANCELLED") {
    return "Cancelled by system / user.";
  }
  return "";
}

function AdminRequestsList({
  items,
  emptyTitle,
  emptySubtitle,
}: {
  items: any[];
  emptyTitle: string;
  emptySubtitle: string;
}) {
  if (!items.length) {
    return (
      <div className="flex-1 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 flex items-center justify-center px-3 py-6">
        <div className="text-center">
          <p className="text-xs text-neutral-400">{emptyTitle}</p>
          <p className="mt-1 text-[11px] text-neutral-500">{emptySubtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto pr-1">
      {items.map((req: any) => {
        const createdAt = req.createdAt ? new Date(req.createdAt) : null;
        const pillClass = statusPillClasses(req.status as RequestStatus);

        return (
          <Link
            key={req.id}
            href={`/admin/request/${req.id}`}
            className="block rounded-lg border border-neutral-700 bg-black/60 px-3 py-2.5 text-xs hover:bg-neutral-900 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-neutral-100 font-medium truncate">
                  {req.productName || "Unnamed product"}
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-500 truncate">
                  {statusSubtitleForAdmin(req.status as RequestStatus)}
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-500 truncate">
                  {req.productLink}
                </p>
              </div>

              <span
                className={`ml-2 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium whitespace-nowrap ${pillClass}`}
              >
                {statusLabel(req.status as RequestStatus)}
              </span>
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

const AdminPage: React.FC = () => {
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
        console.error("Failed to load requests for admin", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pending = items.filter(
    (r) => (r.status || "PENDING").toUpperCase() === "PENDING"
  );
  const matched = items.filter(
    (r) => (r.status || "PENDING").toUpperCase() === "MATCHED"
  );
  const completed = items.filter((r) =>
    ["COMPLETED", "CANCELLED"].includes((r.status || "PENDING").toUpperCase())
  );

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
                Admin workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-neutral-300">
              Signed in as{" "}
              <span className="font-medium text-neutral-100">
                admin@runesse.dev
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 bg-black">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          {/* Hero */}
          <section className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                  Admin • Runesse
                </p>
                <h1 className="mt-2 text-xl font-semibold sm:text-2xl">
                  Review, verify and close Runesse trades.
                </h1>
                <p className="mt-2 text-sm text-neutral-300 max-w-xl">
                  In Phase-1, you can see all buyer requests, track their
                  status, and mark deals as completed after manual
                  verification. Later, this will connect to escrow and
                  automated checks.
                </p>
              </div>
            </div>
          </section>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-xs text-neutral-500">Loading requests…</p>
            </div>
          ) : (
            <section className="grid gap-4 md:grid-cols-3">
              {/* Left – overview / notes */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
                <h2 className="text-sm font-semibold">What to check</h2>
                <p className="text-xs text-neutral-400">
                  This is a Phase-1 mock. Files are not yet stored in backend,
                  but the UI mimics the final review flow.
                </p>

                <ul className="mt-2 space-y-1.5 text-[11px] text-neutral-500">
                  <li>• Confirm product details and price.</li>
                  <li>• Check buyer&apos;s checkout screenshot & product page.</li>
                  <li>• Verify cardholder invoice and card debit proof.</li>
                  <li>• If everything is fine, mark the request completed.</li>
                </ul>
              </div>

              {/* Middle – pending */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
                <h2 className="text-sm font-semibold mb-1">
                  Waiting for match
                </h2>
                <p className="text-xs text-neutral-400 mb-3">
                  New buyer requests that are still pending a cardholder match.
                </p>

                <AdminRequestsList
                  items={pending}
                  emptyTitle="No pending requests right now."
                  emptySubtitle="New buyer requests will appear here."
                />
              </div>

              {/* Right – matched + completed */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
                  <h2 className="text-sm font-semibold mb-1">
                    Matched – verify & close
                  </h2>
                  <p className="text-xs text-neutral-400 mb-3">
                    Requests where a cardholder has already picked the deal.
                    Once proofs are provided, you can mark them completed.
                  </p>

                  <AdminRequestsList
                    items={matched}
                    emptyTitle="No matched requests yet."
                    emptySubtitle="Once a cardholder picks a request, it will show here."
                  />
                </div>

                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col">
                  <h2 className="text-sm font-semibold mb-1">
                    Completed / cancelled
                  </h2>
                  <p className="text-xs text-neutral-400 mb-3">
                    Requests already closed in the system. Cancelled items also
                    appear here.
                  </p>

                  <AdminRequestsList
                    items={completed}
                    emptyTitle="No completed trades yet."
                    emptySubtitle="Once you complete or cancel trades, they will appear here."
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
