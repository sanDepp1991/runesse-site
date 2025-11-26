"use client";

import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <h1 className="text-xl md:text-2xl font-semibold mb-4">
          Create your <span className="text-emerald-400">Runesse</span> account
        </h1>

        <p className="text-sm text-neutral-400 mb-6">
          For Phase-1, sign-up is manual. Please contact the team to create your
          Buyer or Cardholder account.
        </p>

        <Link
          href="/auth/signin"
          className="inline-block border border-emerald-400/60 px-4 py-2 rounded-md text-sm text-emerald-300 hover:bg-emerald-400/10 transition"
        >
          Go to Sign In
        </Link>
      </div>
    </main>
  );
}
