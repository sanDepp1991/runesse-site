"use client";

import Link from "next/link";

export default function SignInPage() {
  const roles = [
    {
      label: "Buyer",
      description:
        "Shop with offers using shared cards. View and track your requests.",
      href: "/buyer",
    },
    {
      label: "Cardholder",
      description:
        "Offer your credit card benefits and earn extra from every transaction.",
      href: "/cardholder",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4">
      <div className="max-w-xl w-full">
        <h1 className="text-xl md:text-2xl font-semibold mb-3">
          Sign in to <span className="text-emerald-400">Runesse</span>
        </h1>
        <p className="text-sm text-neutral-400 mb-5">
          Choose how you want to continue. Authentication will be added later.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <Link
              key={role.href}
              href={role.href}
              className="group border border-neutral-800/70 rounded-xl p-4 hover:border-emerald-400/70 hover:bg-neutral-900/60 transition"
            >
              <div className="text-sm font-medium mb-1 group-hover:text-emerald-300">
                {role.label}
              </div>
              <div className="text-xs text-neutral-400 leading-snug">
                {role.description}
              </div>
            </Link>
          ))}
        </div>

        <p className="text-[11px] text-neutral-500 mt-4">
          Phase-1: We are not enforcing full authentication yet.
        </p>
      </div>
    </main>
  );
}
