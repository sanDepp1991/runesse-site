"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CardholderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { label: "Dashboard", href: "/cardholder" },
    { label: "Saved Cards", href: "/cardholder/cards" },
    { label: "Bank Details", href: "/cardholder/bank" },
  ];

  return (
    <div className="min-h-screen flex bg-black text-neutral-100">
      {/* Sidebar */}
      <aside className="w-60 bg-neutral-900/50 border-r border-neutral-800 p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
          Cardholder
        </h2>

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
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
