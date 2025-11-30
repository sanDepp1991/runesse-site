"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { id: "dashboard", label: "Dashboard", href: "/buyer" },
    { id: "my-requests", label: "My Requests", href: "/buyer" }, // same page, different label
    { id: "create-request", label: "Create Request", href: "/buyer/request/new" },
    { id: "saved-cards", label: "Saved Cards", href: "/buyer/cards" },
    { id: "bank-details", label: "Bank Details", href: "/buyer/bank" },
  ];

  return (
    <div className="min-h-screen flex bg-black text-neutral-100">
      {/* Sidebar */}
      <aside className="w-60 bg-neutral-900/50 border-r border-neutral-800 p-5 space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-sky-400">
          Buyer
        </h2>

        <nav className="flex flex-col gap-1 text-sm">
          {links.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(link.href);
            return (
              <Link
                key={link.id} // ✅ unique key now
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
