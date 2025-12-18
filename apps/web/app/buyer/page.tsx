// apps/web/app/buyer/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { KycBanner } from "../components/KycBanner";
import { supabase } from "../../lib/supabaseClient";

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

export default function BuyerDashboardPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;

        const res = await fetch("/api/buyer/requests/list", {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
          cache: "no-store",
        });

        const data = await res.json();

        if (res.ok && data.ok) {
          setItems(data.items || []);
        } else {
          console.error("Failed to load buyer requests:", data);
        }
      } catch (err) {
        console.error("Buyer requests load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user?.email) {
        setUserEmail(data.user.email);
      } else {
        setUserEmail(null);
      }
    };

    void loadUser();
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
            Buyer Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            View and manage your Runesse requests.
          </p>
          {userEmail && (
            <p className="mt-1 text-[11px] text-neutral-500">
              Signed in as{" "}
              <span className="font-mono text-emerald-300">{userEmail}</span>
            </p>
          )}
        </div>
        <Link
          href="/buyer/request/new"
          className="inline-flex items-center rounded-full bg-neutral-50 px-4 py-2 text-sm font-medium text-black hover:bg-white"
        >
          + New Request
        </Link>
      </div>

      {/* PAN KYC banner */}
      <KycBanner role="BUYER" kycPath="/buyer/kyc" />

      <div className="mt-4 rounded-2xl border border-neutral-800 bg-black/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-200">
            My Requests
          </h2>
          {loading && (
            <span className="text-xs text-neutral-500">Loading…</span>
          )}
        </div>

        {items.length === 0 && !loading && (
          <p className="text-sm text-neutral-500">
            You haven&apos;t created any requests yet.
          </p>
        )}

        {items.length > 0 && (
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
                {items.map((r) => (
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
                        className={
                          "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium " +
                          statusPillClasses(r.status || "PENDING")
                        }
                      >
                        {(r.status || "PENDING").toString()}
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
                        href={`/buyer/request/${r.id}`}
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
