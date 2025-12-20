"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink() {
    setError(null);

    if (!email.includes("@")) {
      setError("Enter a valid admin email");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
      <div className="w-full max-w-sm rounded-xl border border-neutral-800 p-6">
        <h1 className="text-lg font-semibold">Admin Login</h1>

        <input
          className="mt-4 w-full rounded-lg bg-neutral-900 p-2"
          placeholder="admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && <p className="mt-2 text-red-400">{error}</p>}
        {sent && <p className="mt-2 text-green-400">Magic link sent</p>}

        <button
          onClick={sendLink}
          className="mt-4 w-full rounded-lg bg-white text-black p-2"
        >
          Send magic link
        </button>
      </div>
    </div>
  );
}
