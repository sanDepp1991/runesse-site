"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";

const AuthPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);

  // Ask Supabase who is logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!error && data.user && data.user.email) {
        setUserEmail(data.user.email);
      } else {
        setUserEmail(null);
      }
      setCheckingUser(false);
    };

    void checkUser();
  }, []);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth`
        : "http://localhost:3000/auth";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setStatus("Something went wrong. Please try again.");
    } else {
      setStatus("Magic link / OTP sent! Please check your email.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
  };

  if (checkingUser) {
    return (
      <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4">
        <p className="text-sm text-neutral-400">Checking your session…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950/90 px-5 py-6 md:px-7 md:py-8 shadow-[0_0_40px_rgba(0,0,0,0.9)]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400 mb-2">
          Runesse login
        </p>
        <h1 className="text-xl md:text-2xl font-semibold">
          Sign in to your account.
        </h1>
        <p className="mt-1 text-xs md:text-sm text-neutral-400">
          Use your email to receive a one-time magic link. After login, you can
          go to Buyer, Cardholder, or Dashboard (for both).
        </p>

        {userEmail ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/5 px-3 py-2.5 text-xs md:text-sm">
              <p className="text-neutral-200">
                ✅ Signed in as{" "}
                <span className="font-mono text-emerald-300">{userEmail}</span>
              </p>
              <p className="mt-1 text-[11px] text-neutral-400">
                Choose how you want to use Runesse right now.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3 text-xs">
              <Link
                href="/buyer"
                className="rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-3 hover:border-emerald-400 hover:bg-neutral-900 transition-colors flex flex-col justify-between"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-400 mb-1">
                    Buyer
                  </p>
                  <p className="text-xs font-semibold text-neutral-50">
                    Save more on your own purchases.
                  </p>
                </div>
                <span className="mt-2 text-[11px] text-emerald-300">
                  Go to Buyer →
                </span>
              </Link>

              <Link
                href="/cardholder"
                className="rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-3 hover:border-emerald-400 hover:bg-neutral-900 transition-colors flex flex-col justify-between"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-400 mb-1">
                    Cardholder
                  </p>
                  <p className="text-xs font-semibold text-neutral-50">
                    Earn by helping buyers use your cards.
                  </p>
                </div>
                <span className="mt-2 text-[11px] text-emerald-300">
                  Go to Cardholder →
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="rounded-xl border border-neutral-800 bg-neutral-900/70 px-3 py-3 hover:border-emerald-400 hover:bg-neutral-900 transition-colors flex flex-col justify-between"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-400 mb-1">
                    Both
                  </p>
                  <p className="text-xs font-semibold text-neutral-50">
                    Switch between Buyer and Cardholder.
                  </p>
                </div>
                <span className="mt-2 text-[11px] text-emerald-300">
                  Go to Dashboard →
                </span>
              </Link>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSignOut}
                className="text-[11px] text-neutral-400 hover:text-neutral-100 underline underline-offset-2"
              >
                Sign out
              </button>
              <Link
                href="/"
                className="text-[11px] text-neutral-400 hover:text-neutral-100 underline underline-offset-2"
              >
                Back to landing
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <form onSubmit={handleSendMagicLink} className="space-y-3">
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
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-full bg-white text-black text-sm font-semibold px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/90"
              >
                {loading ? "Sending magic link…" : "Send magic link"}
              </button>
            </form>

            {status && (
              <p className="text-[11px] text-neutral-300">{status}</p>
            )}

            <p className="text-[11px] text-neutral-500">
              New to Runesse?{" "}
              <Link
                href="/auth/signup"
                className="text-emerald-400 hover:underline underline-offset-2"
              >
                Create an account
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
};

export default AuthPage;
