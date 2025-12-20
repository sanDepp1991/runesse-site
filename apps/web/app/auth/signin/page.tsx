// apps/web/app/auth/signin/page.tsx
"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function SignInInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const prefillEmail = useMemo(() => {
    return (searchParams.get("email") || "").trim();
  }, [searchParams]);

  const [email, setEmail] = useState(prefillEmail);
  const [loading, setLoading] = useState(false);

  const COOLDOWN_SECONDS = 30;
  const [cooldown, setCooldown] = useState(0);

  const [sent, setSent] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      if (data.session) {
        window.location.href = "/auth/continue";
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        window.location.href = "/auth/continue";
      }
    });

    void init();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (prefillEmail && prefillEmail !== email) setEmail(prefillEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEmail]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  async function redirectByRoles(authedEmail: string) {
    const meRes = await fetch(`/api/me?email=${encodeURIComponent(authedEmail)}`, {
      cache: "no-store",
    });
    const me = await meRes.json().catch(() => null);

    if (meRes.ok && me?.ok && me?.roles) {
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

    router.replace("/buyer");
  }

  async function continueIfAuthenticated() {
    setError(null);

    const { data } = await supabase.auth.getSession();
    const authedEmail = data.session?.user?.email?.toLowerCase() || null;

    if (!authedEmail) {
      setError("You are not signed in yet. Please click the magic link in your email.");
      return;
    }

    const pageEmail = email.trim().toLowerCase();
    if (pageEmail && authedEmail !== pageEmail) {
      setError(`You are signed in as ${authedEmail}. Please sign out and sign in with ${pageEmail}.`);
      return;
    }

    await redirectByRoles(authedEmail);
  }

  // Auto-continue if session already exists
  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const { data } = await supabase.auth.getSession();
        const authedEmail = data.session?.user?.email?.toLowerCase() || null;

        if (!authedEmail) return;

        const pageEmail = email.trim().toLowerCase();
        if (pageEmail && authedEmail !== pageEmail) {
          setError(`You are signed in as ${authedEmail}. Please sign out and sign in with ${pageEmail}.`);
          return;
        }

        if (cancelled) return;
        await redirectByRoles(authedEmail);
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMagicLink() {
    setError(null);
    setSent(false);

    if (cooldown > 0) return;

    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentEmail = sessionData.session?.user?.email?.toLowerCase() || null;
      if (currentEmail && currentEmail !== clean) {
        await supabase.auth.signOut();
      }

      const origin = window.location.origin;
      const next = `/auth/continue`;
      const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: clean,
        options: {
          emailRedirectTo,
        },
      });

      if (otpError) throw otpError;

      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch (e: any) {
      setError(e?.message || "Unable to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400 mb-2">
            Signing you in
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold mb-2">Please wait…</h1>
          <p className="text-sm text-neutral-400 mb-6">We are continuing to your workspace.</p>
          {error && (
            <p className="text-[11px] text-red-200 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400 mb-2">
          Runesse Access
        </p>

        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Sign in</h1>

        <p className="text-sm text-neutral-400 mb-6">Enter your email to receive a magic link.</p>

        <div className="space-y-4">
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

          {error && (
            <p className="text-[11px] text-red-200 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {sent && (
            <p className="text-[11px] text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2">
              Magic link sent. Please check your email and click the link.
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={sendMagicLink}
              disabled={loading || cooldown > 0}
              className="inline-flex items-center justify-center rounded-full bg-white text-black text-sm font-semibold px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/90"
            >
              {loading ? "Sending…" : cooldown > 0 ? `Send again in ${cooldown}s` : "Send magic link"}
            </button>

            <button
              onClick={continueIfAuthenticated}
              className="inline-flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-neutral-100 text-sm font-semibold px-5 py-2 hover:bg-neutral-900"
            >
              Continue
            </button>
          </div>

          <button
            onClick={() => router.push(`/auth/signup?email=${encodeURIComponent(email.trim())}`)}
            className="text-sm text-neutral-300 hover:text-white"
          >
            New here? Go to Sign up
          </button>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4 py-10">
          <div className="text-sm text-neutral-300">Loading…</div>
        </main>
      }
    >
      <SignInInner />
    </Suspense>
  );
}
