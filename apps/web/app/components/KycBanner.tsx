// apps/web/app/components/KycBanner.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

type Role = "BUYER" | "CARDHOLDER";

type PanStatusType = "PENDING" | "VERIFIED" | "FAILED";

interface Props {
  role: Role;
  kycPath: string; // "/buyer/kyc" or "/cardholder/kyc"
}

export const KycBanner: React.FC<Props> = ({ role, kycPath }) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PanStatusType>("PENDING");
  const [maskedPan, setMaskedPan] = useState<string | null>(null);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        // 1️⃣ Ask Supabase for current session (client-side)
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token ?? null;

        // 2️⃣ Call our PAN status API, sending token if available
        const res = await fetch(`/api/kyc/pan/status?role=${role}`, {
          cache: "no-store",
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });

        const data = await res.json();

        if (res.ok && data.ok && data.user) {
          setStatus(data.user.panStatus as PanStatusType);
          setMaskedPan(data.user.panMasked ?? null);
        }
      } catch (e) {
        console.error("KYC status load error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, [role]);

  if (loading) {
    return (
      <div className="mb-4 rounded-xl border border-gray-700 bg-black/40 px-4 py-3 text-sm text-gray-300">
        Checking PAN KYC status…
      </div>
    );
  }

  const statusLabel =
    status === "VERIFIED"
      ? "Verified"
      : status === "FAILED"
      ? "Failed"
      : "Pending";

  const statusColorClasses =
    status === "VERIFIED"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
      : status === "FAILED"
      ? "bg-red-500/15 text-red-300 border-red-500/40"
      : "bg-amber-500/15 text-amber-200 border-amber-500/40";

  return (
    <div className="mb-6 rounded-2xl border border-gray-800 bg-black/40 px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColorClasses}`}
            >
              PAN KYC · {statusLabel}
            </span>
          </div>

          {maskedPan && (
            <p className="mt-1 text-xs text-gray-400">
              Masked PAN: <span className="font-mono">{maskedPan}</span>
            </p>
          )}

          {status !== "VERIFIED" && (
            <p className="mt-2 text-xs text-gray-400">
              Complete your PAN KYC so that we can safely enable bank
              verification and card-based transactions.
            </p>
          )}
          {status === "VERIFIED" && (
            <p className="mt-2 text-xs text-gray-400">
              Your PAN is verified. You can now verify bank accounts and use
              Runesse normally.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-row gap-2">
          <Link
            href={kycPath}
            className="inline-flex items-center justify-center rounded-full border border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-100 hover:border-gray-500 hover:bg-gray-900/60"
          >
            {status === "VERIFIED" ? "View KYC details" : "Complete PAN KYC"}
          </Link>
        </div>
      </div>
    </div>
  );
};
