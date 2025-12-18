"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WorkspaceSwitcher from "../../components/WorkspaceSwitcher";
import SignOutButton from "../../components/SignOutButton";
import { useRoleAccess } from "../../lib/roleAccess";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const roles = useRoleAccess();

  const [upgrading, setUpgrading] = React.useState(false);
  const [upgradeError, setUpgradeError] = React.useState<string | null>(null);

  const enableCardholder = async () => {
    setUpgradeError(null);
    setUpgrading(true);
    try {
      const ok = await roles.enableRole("CARDHOLDER");
      if (!ok) setUpgradeError(roles.error || "Unable to enable Cardholder role.");
    } finally {
      setUpgrading(false);
    }
  };


  const links = [
    { id: "dashboard", label: "Dashboard", href: "/buyer" },
    { id: "my-requests", label: "My Requests", href: "/buyer" },
    { id: "create-request", label: "Create Request", href: "/buyer/request/new" },
    { id: "saved-cards", label: "Saved Cards", href: "/buyer/cards" },
    { id: "bank-details", label: "Bank Details", href: "/buyer/bank" },
  ];

  return (
    <div className="min-h-screen flex bg-black text-neutral-100">
      <aside className="w-60 bg-neutral-900/50 border-r border-neutral-800 p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-sky-400">
          Buyer
        </h2>

        <WorkspaceSwitcher />

        {/* Upgrade link: Buyer-only users can enable Cardholder role */}
        {!roles.loading && roles.buyerEnabled && !roles.cardholderEnabled && (
          <div className="mt-1 rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
            <p className="text-[11px] text-neutral-300">
              Want to earn by using your card offers?
            </p>
            <button
              onClick={enableCardholder}
              disabled={upgrading}
              className="mt-2 w-full rounded-xl bg-neutral-100 px-3 py-2 text-xs font-semibold text-black hover:bg-white disabled:opacity-60"
            >
              {upgrading ? "Enabling..." : "Sign up as Cardholder"}
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
                key={link.id}
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
