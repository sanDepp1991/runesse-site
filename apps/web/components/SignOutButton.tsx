"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function SignOutButton({
  className,
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const signOut = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
      router.push("/auth");
      router.refresh();
    }
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={loading}
      className={
        className ||
        "w-full rounded-xl border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-xs font-semibold text-neutral-200 hover:bg-neutral-900/50 disabled:opacity-60"
      }
    >
      {loading ? "Signing out..." : label}
    </button>
  );
}
