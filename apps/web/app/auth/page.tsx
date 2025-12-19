"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AuthGatewayInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = useMemo(() => {
    const q = searchParams.get("email");
    return q ? q.trim() : "";
  }, [searchParams]);

  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const blocked = !!status && status.startsWith("Setup required:");

  const onContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    const cleaned = email.trim().toLowerCase();
    if (!cleaned) {
      setStatus("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/auth/exists?email=${encodeURIComponent(cleaned)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        if (data?.code === "MISSING_DB_URL") {
          setStatus(
            "Setup required: RUNESSE_DATABASE_URL is missing. Create apps/web/.env.local (and/or apps/db/.env) and restart pnpm dev:web."
          );
        } else {
          setStatus("Could not check your email. Please try again.");
        }
        return;
      }

      // Route based on existence
      if (data.exists) {
        router.push(`/auth/signin?email=${encodeURIComponent(cleaned)}`);
      } else {
        router.push(`/auth/signup?email=${encodeURIComponent(cleaned)}`);
      }
    } catch (err) {
      console.error(err);
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400 mb-2">
          Runesse Access
        </p>

        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
          Enter your email
        </h1>

        <p className="text-sm text-neutral-400 mb-6">
          We will guide you to the right next step.
        </p>

        <form onSubmit={onContinue} className="space-y-4">
          <label className="block text-xs text-neutral-300">
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-full border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          {status && (
            <p className="text-[11px] text-neutral-300 bg-neutral-900/70 border border-neutral-700 rounded-xl px-3 py-2">
              {status}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || blocked}
            className="inline-flex items-center justify-center rounded-full bg-white text-black text-sm font-semibold px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/90"
          >
            {loading ? "Checking…" : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AuthGatewayPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4 py-10">
          <div className="text-sm text-neutral-300">Loading…</div>
        </main>
      }
    >
      <AuthGatewayInner />
    </Suspense>
  );
}
