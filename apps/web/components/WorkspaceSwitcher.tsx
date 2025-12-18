"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRoleAccess } from "../lib/roleAccess";

export default function WorkspaceSwitcher() {
  const pathname = usePathname();
  const roles = useRoleAccess();

  const inBuyer = pathname.startsWith("/buyer");
  const inCardholder = pathname.startsWith("/cardholder");

  // Only show switcher if user is signed up for BOTH roles.
  // Role switching must NOT be gated by saved cards.
  if (roles.loading) return null;
  if (!roles.both) return null;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Workspace
      </p>

      <div className="flex gap-2">
        {/* Buyer */}
        <Link
          href="/buyer"
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-center border ${
            inBuyer
              ? "bg-neutral-800 text-white border-neutral-700"
              : "text-neutral-300 border-neutral-800 hover:bg-neutral-900/60"
          }`}
        >
          Buyer
        </Link>

        {/* Cardholder */}
        <Link
          href="/cardholder"
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold text-center border ${
            inCardholder
              ? "bg-neutral-800 text-white border-neutral-700"
              : "text-neutral-300 border-neutral-800 hover:bg-neutral-900/60"
          }`}
        >
          Cardholder
        </Link>
      </div>
    </div>
  );
}
