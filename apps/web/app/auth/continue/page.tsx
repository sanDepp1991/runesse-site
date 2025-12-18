// apps/web/app/auth/continue/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function AuthContinuePage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { data } = await supabase.auth.getSession();
        const email = data.session?.user?.email?.trim().toLowerCase() || null;

        if (!email) {
          setError("Session not found. Please try signing in again.");
          return;
        }

        const meRes = await fetch(`/api/me?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
        });
        const me = await meRes.json().catch(() => null);

        if (!cancelled && meRes.ok && me?.ok && me?.roles) {
          const r = me.roles as {
            buyerEnabled: boolean;
            cardholderEnabled: boolean;
            both: boolean;
          };

          if (r.buyerEnabled && !r.cardholderEnabled) router.replace("/buyer");
          else if (r.cardholderEnabled && !r.buyerEnabled) router.replace("/cardholder");
          else router.replace("/buyer"); // default workspace for BOTH
          return;
        }

        if (!cancelled) router.replace("/buyer");
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Unable to continue.");
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
        <h1 className="text-xl font-semibold">Signing you in…</h1>
        <p className="mt-2 text-sm text-neutral-300">
          Please wait while we continue to your workspace.
        </p>

        {error ? (
          <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
