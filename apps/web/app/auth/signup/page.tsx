"use client";

import React, { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Role = "BUYER" | "CARDHOLDER" | "BOTH";

const roleCards: {
  key: Role;
  title: string;
  subtitle: string;
  description: string;
  recommended?: boolean;
}[] = [
  {
    key: "BUYER",
    title: "Sign up as Buyer",
    subtitle: "I want to save more on my own purchases.",
    description:
      "Paste product links, see the best card-based offers available via Runesse, and request a cardholder to help complete the payment.",
  },
  {
    key: "CARDHOLDER",
    title: "Sign up as Cardholder",
    subtitle: "I want to earn from my existing cards.",
    description:
      "Save the cards you already own, receive matching buyer requests, and upload proof after making the payment at the merchant.",
  },
  {
    key: "BOTH",
    title: "Sign up as Both",
    subtitle: "Recommended by Runesse.",
    description:
      "Use Runesse as a Buyer when you shop and as a Cardholder when your cards can help others. Perfect for power users.",
    recommended: true,
  },
];

export default function SignUpPage() {
  const [selectedRole, setSelectedRole] = useState<Role>("BOTH");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);

    try {
      // Store the intended role locally – onboarding can read this later.
      if (typeof window !== "undefined") {
        window.localStorage.setItem("runesse.intendedRole", selectedRole);
      }

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

      if (error) {
        console.error("Error sending magic link", error);
        setStatus("Something went wrong. Please try again.");
      } else {
        setStatus(
          "We’ve sent you a magic link. Open it on this device to continue to Runesse login."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400 mb-2">
          Create your Runesse account
        </p>
        <h1 className="text-xl md:text-2xl font-semibold mb-2">
          How do you want to use Runesse?
        </h1>
        <p className="text-xs md:text-sm text-neutral-400 mb-4 max-w-2xl">
          Choose your role first. In Phase-1, Runesse works inside a trusted
          friends &amp; family circle. You can always change how you use it
          later.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Role selection cards */}
          <div className="grid gap-3 md:grid-cols-3">
            {roleCards.map((role) => {
              const isSelected = selectedRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedRole(role.key)}
                  className={[
                    "relative text-left rounded-2xl border px-4 py-4 text-xs md:text-sm transition-all",
                    "bg-neutral-900/60 hover:bg-neutral-900/90",
                    isSelected
                      ? "border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.25)]"
                      : "border-neutral-800",
                  ].join(" ")}
                >
                  {role.recommended && (
                    <span className="absolute right-3 top-3 rounded-full border border-emerald-400/70 bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      Recommended
                    </span>
                  )}
                  <p className="font-semibold text-sm mb-1">{role.title}</p>
                  <p className="text-[11px] text-emerald-300 mb-1">
                    {role.subtitle}
                  </p>
                  <p className="text-[11px] text-neutral-400 leading-snug">
                    {role.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Email + CTA */}
          <div className="space-y-2">
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
            <p className="text-[10px] text-neutral-500">
              We&apos;ll send you a one-time magic link. Open it on this device
              and you&apos;ll land on the Runesse login page.
            </p>
          </div>

          {status && (
            <p className="text-[11px] text-neutral-300 bg-neutral-900/70 border border-neutral-700 rounded-xl px-3 py-2">
              {status}
            </p>
          )}

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-full bg-white text-black text-sm font-semibold px-5 py-2 disabled:opacity-60 disabled:cursor-not-allowed hover:bg-white/90"
            >
              {loading ? "Sending magic link…" : "Send magic link"}
            </button>
            <p className="text-[11px] text-neutral-500">
              Already have an account?{" "}
              <a
                href="/auth"
                className="text-emerald-400 hover:underline underline-offset-2"
              >
                Go to Runesse login
              </a>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
