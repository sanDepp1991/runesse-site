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
  buyerEmail?: string | null;
  matchedAt?: string | Date | null;
  completedAt?: string | Date | null;
  createdAt?: string | Date | null;
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
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Load cardholder inbox + taken requests
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

        if (res.ok && data?.ok) {
          setInbox(Array.isArray(data.inbox) ? data.inbox : []);
          setMyRequests(Array.isArray(data.myRequests) ? data.myRequests : []);
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

  // Load signed-in email
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

  const formatPrice = (value?: number | null) => {
    if (value == null || Number.isNaN(value)) return "-";
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
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
          {userEmail && (
            <p className="mt-1 text-[11px] text-neutral-500">
              Signed in as{" "}
              <span className="font-mono text-emerald-300">{userEmail}</span>
            </p>
          )}
        </div>

        <Link
          href="/cardholder/cards"
          className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-xs font-medium text-black shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400"
        >
          Manage my cards
        </Link>
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
            There are no matching buyer requests for your cards right now.
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
              <tbody className="divide-y divide-neutral-900">
                {inbox.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-4 align-top text-neutral-400">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <div className="max-w-[260px]">
                        <div className="truncate text-xs font-medium text-neutral-100">
                          {item.productName || "—"}
                        </div>
                        {item.productLink && (
                          <a
                            href={item.productLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 block truncate text-[11px] text-sky-400 hover:underline"
                          >
                            View product
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4 align-top text-[11px] text-neutral-400">
                      {item.buyerEmail || "—"}
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <span className="text-xs font-medium">
                        {formatPrice(item.checkoutPrice)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 align-top text-right">
                      <Link
                        href={`/cardholder/request/${item.id}`}
                        className="text-xs font-medium text-emerald-400 hover:underline"
                      >
                        View &amp; take →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My taken requests */}
      <div className="mt-6 rounded-2xl border border-neutral-800 bg-black/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-200">
            My Taken Requests
          </h2>
        </div>

        {loading && (
          <p className="text-sm text-neutral-500">
            Loading your taken requests…
          </p>
        )}

        {!loading && myRequests.length === 0 && (
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
                  <th className="py-2 pr-4">Buyer</th>
                  <th className="py-2 pr-4">Price</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {myRequests.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-4 align-top text-neutral-400">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <div className="max-w-[260px]">
                        <div className="truncate text-xs font-medium text-neutral-100">
                          {item.productName || "—"}
                        </div>
                        {item.productLink && (
                          <a
                            href={item.productLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 block truncate text-[11px] text-sky-400 hover:underline"
                          >
                            View product
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4 align-top text-[11px] text-neutral-400">
                      {item.buyerEmail || "—"}
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <span className="text-xs font-medium">
                        {formatPrice(item.checkoutPrice)}
                      </span>
                    </td>
                    <td className="py-2 pr-4 align-top">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${statusPillClasses(
                          item.status || "PENDING",
                        )}`}
                      >
                        {item.status || "PENDING"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 align-top text-right">
                      <Link
                        href={`/cardholder/request/${item.id}`}
                        className="text-xs font-medium text-emerald-400 hover:underline"
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
