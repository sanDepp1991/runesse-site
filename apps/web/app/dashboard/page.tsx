"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseClient";

const DashboardPage: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user?.email) {
        setUserEmail(data.user.email);
      }
      setLoading(false);
    };

    void loadUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">Loading your dashboard…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl border border-neutral-800 rounded-2xl bg-neutral-900/70 px-6 py-6 md:px-8 md:py-8 shadow-[0_0_40px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Runesse account
            </p>
            <h1 className="mt-2 text-xl md:text-2xl font-semibold">
              Choose how you want to use Runesse today.
            </h1>
            {userEmail && (
              <p className="mt-1 text-xs md:text-sm text-neutral-400">
                Signed in as{" "}
                <span className="font-mono text-neutral-200">{userEmail}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center rounded-full border border-neutral-700 px-3 py-1.5 text-[11px] font-medium text-neutral-300 hover:bg-neutral-800/80"
          >
            Sign out
          </button>
        </div>

        <p className="mt-4 text-xs md:text-sm text-neutral-300 max-w-xl">
          You told us during onboarding that you&apos;re comfortable using
          Runesse as both a{" "}
          <span className="font-semibold">Buyer</span> and a{" "}
          <span className="font-semibold">Cardholder</span>. Pick the mode you
          want to use right now.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link
            href="/buyer"
            className="group rounded-xl border border-neutral-800 bg-black/40 px-4 py-4 md:px-5 md:py-5 flex flex-col justify-between hover:border-emerald-500/80 hover:bg-neutral-900/80 transition-colors"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-400 mb-1">
                Buyer mode
              </p>
              <h2 className="text-sm md:text-base font-semibold text-neutral-50">
                I want to save more on my own purchases
              </h2>
              <p className="mt-2 text-[11px] md:text-xs text-neutral-400">
                Paste a product link, see the best card-based offers available,
                and request a cardholder to help complete the payment.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center text-[11px] md:text-xs text-emerald-300 group-hover:underline">
              Go to Buyer →
            </span>
          </Link>

          <Link
            href="/cardholder"
            className="group rounded-xl border border-neutral-800 bg-black/40 px-4 py-4 md:px-5 md:py-5 flex flex-col justify-between hover:border-emerald-500/80 hover:bg-neutral-900/80 transition-colors"
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-400 mb-1">
                Cardholder mode
              </p>
              <h2 className="text-sm md:text-base font-semibold text-neutral-50">
                I want to earn by helping buyers use my cards
              </h2>
              <p className="mt-2 text-[11px] md:text-xs text-neutral-400">
                Save your cards, receive matching buyer requests, and upload
                proofs after payment so Runesse can verify and track your
                reimbursements.
              </p>
            </div>
            <span className="mt-3 inline-flex items-center text-[11px] md:text-xs text-emerald-300 group-hover:underline">
              Go to Cardholder →
            </span>
          </Link>
        </div>

        <p className="mt-6 text-[10px] md:text-[11px] text-neutral-500">
          In Phase-1, payments and reimbursements happen outside the app after
          proof verification. Runesse keeps a full audit trail of every
          request.
        </p>
      </div>
    </main>
  );
};

export default DashboardPage;
