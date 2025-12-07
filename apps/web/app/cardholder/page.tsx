// apps/web/app/cardholder/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { KycBanner } from "../components/KycBanner";
import { supabase } from "../lib/supabaseClient";

type RequestStatus = "PENDING" | "MATCHED" | "COMPLETED" | "CANCELLED" | string;

interface RequestItem {
  id: string;
  productName?: string | null;
  productLink?: string | null;
  checkoutPrice?: number | null;
  status?: RequestStatus;
  createdAt?: string | Date | null;
  matchedAt?: string | Date | null;
  completedAt?: string | Date | null;
  buyerEmail?: string | null;
}

function statusPillClasses(status: RequestStatus) {
  const s = (status || "PENDING").toUpperCase();
  if (s === "COMPLETED") {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
  }
  if (s === "MATCHED") {
    return "bg-sky-500/15 text-sky-300 border-sky-500/40";
  }
  if (s === "CANCELLED" || s === "REJECTED") {
    return "bg-red-500/15 text-red-300 border-red-500/40";
  }
  return "bg-amber-500/15 text-amber-200 border-amber-500/40";
}

export default function CardholderDashboardPage() {
  const [inbox, setInbox] = useState<RequestItem[]>([]);
  const [myRequests, setMyRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;

        const res = await fetch("/api/cardholder/requests/inbox", {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
          cache: "no-store",
        });

        const data = await res.json();

        if (data?.ok) {
          setInbox(data.inbox || []);
          setMyRequests(data.myRequests || []);
        } else {
          console.error("Failed to load cardholder inbox:", data);
        }
      } catch (err) {
        console.error("Cardholder inbox load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const formatDate = (value?: string | Date | null) => {
    if (!value) return "-";
    const d = typeof value === "string" ? new Date(value) : value;
    return d.toLocaleString();
  };

  return (
    <div className="px-4 py-6 sm:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">
            Cardholder Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            See available buyer requests and manage the ones you&apos;ve taken.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/cardholder/cards"
            className="rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900"
          >
            Manage cards
          </Link>
        </div>
      </div>

      {/* KYC banner */}
      <KycBanner role="CARDHOLDER" kycPath="/cardholder/kyc" />

      {/* Available requests */}
      <div className="mt-6 rounded-2xl border border-neutral-800 bg-black/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-200">
            Available Requests
          </h2>
        </div>

        {loading && (
          <p className="text-sm text-neutral-500">
            Loading available requests…
          </p>
        )}

        {!loading && inbox.length === 0 && (
          <p className="text-sm text-neutral-500">
            No new requests are available right now. Check back soon.
          </p>
        )}

        {inbox.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-neutral-300">
              <thead className="border-b border-neutral-800 text-neutral-400">
                <tr>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Buyer</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {inbox.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-neutral-900/60 last:border-0 hover:bg-neutral-900/40"
                  >
                    <td className="py-2 pr-4 align-top text-[11px] text-neutral-400">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-medium text-neutral-100">
                          {r.productName || "Unnamed request"}
                        </div>
                        {r.productLink && (
                          <a
                            href={r.productLink}
                            target="_blank"
                            rel="noreferrer"
                            className="max-w-xs truncate text-[11px] text-sky-400 hover:underline"
                          >
                            {r.productLink}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4 align-top text-[11px] text-neutral-400">
                      {r.buyerEmail || "-"}
                    </td>
                    <td className="py-2 pr-4 align-top text-xs">
                      {r.checkoutPrice != null
                        ? `₹${r.checkoutPrice.toLocaleString("en-IN")}`
                        : "-"}
                    </td>
                    <td className="py-2 pr-0 align-top text-right text-xs">
                      <Link
                        href={`/cardholder/request/${r.id}`}
                        className="text-sky-400 hover:underline"
                      >
                        View details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My requests */}
      <div className="mt-6 rounded-2xl border border-neutral-800 bg-black/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-200">
            My Taken Requests
          </h2>
        </div>

        {myRequests.length === 0 && (
          <p className="text-sm text-neutral-500">
            You haven&apos;t accepted any requests yet.
          </p>
        )}

        {myRequests.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-neutral-300">
              <thead className="border-b border-neutral-800 text-neutral-400">
                <tr>
                  <th className="py-2 pr-4">Created</th>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Matched / Completed</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myRequests.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-neutral-900/60 last:border-0 hover:bg-neutral-900/40"
                  >
                    <td className="py-2 pr-4 align-top text-[11px] text-neutral-400">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs font-medium text-neutral-100">
                          {r.productName || "Unnamed request"}
                        </div>
                        {r.productLink && (
                          <a
                            href={r.productLink}
                            target="_blank"
                            rel="noreferrer"
                            className="max-w-xs truncate text-[11px] text-sky-400 hover:underline"
                          >
                            {r.productLink}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4 align-top text-xs">
                      {r.checkoutPrice != null
                        ? `₹${r.checkoutPrice.toLocaleString("en-IN")}`
                        : "-"}
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusPillClasses(
                          r.status || "PENDING",
                        )}`}
                      >
                        {r.status || "PENDING"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 align-top text-[11px] text-neutral-400">
                      {r.matchedAt && (
                        <div>Matched: {formatDate(r.matchedAt)}</div>
                      )}
                      {r.completedAt && (
                        <div>Completed: {formatDate(r.completedAt)}</div>
                      )}
                    </td>
                    <td className="py-2 pr-0 align-top text-right text-xs">
                      <Link
                        href={`/cardholder/request/${r.id}`}
                        className="text-sky-400 hover:underline"
                      >
                        View details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
