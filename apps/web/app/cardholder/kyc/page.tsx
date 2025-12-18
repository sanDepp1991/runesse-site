// apps/web/app/cardholder/kyc/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type PanStatusType = "PENDING" | "VERIFIED" | "FAILED";

const CardholderPanKycPage: React.FC = () => {
  const [panNumber, setPanNumber] = useState("");
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(""); // YYYY-MM-DD

  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [status, setStatus] = useState<PanStatusType>("PENDING");
  const [maskedPan, setMaskedPan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Load current PAN status for this logged-in user as CARDHOLDER
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const token = session?.access_token ?? null;

        const res = await fetch("/api/kyc/pan/status?role=CARDHOLDER", {
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
      } catch (err) {
        console.error("Cardholder PAN status error", err);
      } finally {
        setLoadingStatus(false);
      }
    };

    loadStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSubmit(true);
    setMessage(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;

      const res = await fetch("/api/kyc/pan/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          panNumber,
          fullName,
          dob,
          role: "CARDHOLDER",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data?.error || "PAN verification failed");
      }

      setStatus("VERIFIED");
      setMaskedPan(data.user?.panMasked ?? null);
      setMessage("PAN verified successfully.");
    } catch (err: any) {
      console.error("Cardholder PAN verify error", err);
      setStatus("FAILED");
      setMessage(err?.message || "PAN verification failed.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const statusLabel =
    status === "VERIFIED"
      ? "Verified"
      : status === "FAILED"
      ? "Failed"
      : "Pending";

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="text-xl font-semibold mb-4 text-neutral-50">
        Cardholder PAN KYC
      </h1>

      {/* Status card */}
      <div className="mb-6 rounded-xl border border-neutral-800 bg-neutral-950/70 px-4 py-3 text-sm">
        {loadingStatus ? (
          <p className="text-neutral-400">Checking current status…</p>
        ) : (
          <>
            <p className="text-neutral-300">
              <span className="font-medium">Current status:</span>{" "}
              <span className="uppercase">{statusLabel}</span>
            </p>
            {maskedPan && (
              <p className="mt-1 text-xs text-neutral-400">
                Masked PAN: <span className="font-mono">{maskedPan}</span>
              </p>
            )}
            {message && (
              <p className="mt-2 text-xs text-emerald-300">{message}</p>
            )}
          </>
        )}
      </div>

      {/* PAN form */}
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block text-neutral-300 mb-1">
            PAN Number<span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
            maxLength={10}
            className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            placeholder="ABCDE1234F"
            required
          />
        </div>

        <div>
          <label className="block text-neutral-300 mb-1">
            Full Name (as per PAN)
            <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="block text-neutral-300 mb-1">
            Date of Birth<span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full rounded-lg border border-neutral-700 bg-black px-3 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loadingSubmit}
          className="mt-2 w-full rounded-lg bg-neutral-50 px-3 py-2 text-sm font-medium text-black hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loadingSubmit ? "Verifying…" : "Verify PAN"}
        </button>
      </form>
    </div>
  );
};

export default CardholderPanKycPage;
