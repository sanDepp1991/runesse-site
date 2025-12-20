// apps/web/app/auth/callback/page.tsx
"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    const run = async () => {
      try {
        const next = searchParams.get("next");
        const target = next && next.startsWith("/") ? next : "/auth/continue";

        // 1) PKCE flow: ?code=...
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            router.replace(`/auth?error=${encodeURIComponent(error.message)}`);
            return;
          }
          router.replace(target);
          return;
        }

        // 2) Implicit hash flow: #access_token=...
        const authAny = supabase.auth as any;
        if (typeof authAny.getSessionFromUrl === "function") {
          setMsg("Finalizing sign-in…");
          const { data, error } = await authAny.getSessionFromUrl({
            storeSession: true,
          });
          if (error) {
            router.replace(`/auth?error=${encodeURIComponent(error.message)}`);
            return;
          }
          if (data?.session) {
            router.replace(target);
            return;
          }
        }

        // 3) Fallback: session already exists
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.replace(target);
          return;
        }

        router.replace(
          `/auth?error=${encodeURIComponent("Session not found. Please try again.")}`
        );
      } catch (e: any) {
        router.replace(`/auth?error=${encodeURIComponent(e?.message || "Auth failed")}`);
      }
    };

    void run();
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
      <p className="text-sm text-neutral-300">{msg}</p>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-black text-white px-6">
          <p className="text-sm text-neutral-300">Loading…</p>
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
