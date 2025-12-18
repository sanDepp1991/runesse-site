"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WorkspaceSwitcher from "../../components/WorkspaceSwitcher";
import SignOutButton from "../../components/SignOutButton";
import { useRoleAccess } from "../../lib/roleAccess";

export default function CardholderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const roles = useRoleAccess();

  const [upgrading, setUpgrading] = React.useState(false);
  const [upgradeError, setUpgradeError] = React.useState<string | null>(null);

  const enableBuyer = async () => {
    setUpgradeError(null);
    setUpgrading(true);
    try {
      const ok = await roles.enableRole("BUYER");
      if (!ok) setUpgradeError(roles.error || "Unable to enable Buyer role.");
    } finally {
      setUpgrading(false);
    }
  };
  const links = [
    { label: "Dashboard", href: "/cardholder" },
    { label: "Saved Cards", href: "/cardholder/cards" },
    { label: "Bank Details", href: "/cardholder/bank" },
  ];

  return (
    <div className="min-h-screen flex bg-black text-neutral-100">
      <aside className="w-60 bg-neutral-900/50 border-r border-neutral-800 p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
          Cardholder
        </h2>

        <WorkspaceSwitcher />

        {/* Upgrade link: Cardholder-only users can enable Buyer role */}
        {!roles.loading && roles.cardholderEnabled && !roles.buyerEnabled && (
          <div className="mt-1 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
            <p className="text-[11px] text-neutral-300">
              Want to request offers as a buyer?
            </p>
            <button
              onClick={enableBuyer}
              disabled={upgrading}
              className="mt-2 w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-black hover:bg-white disabled:opacity-60"
            >
              {upgrading ? "Enabling..." : "Sign up as Buyer"}
            </button>
            {upgradeError && (
              <p className="mt-2 text-[11px] text-red-400">{upgradeError}</p>
            )}
          </div>
        )}

        <nav className="flex flex-col gap-1 text-sm">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg ${
                  active
                    ? "bg-neutral-800 text-white border border-neutral-700"
                    : "text-neutral-400 hover:bg-neutral-800/40"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-3">
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
