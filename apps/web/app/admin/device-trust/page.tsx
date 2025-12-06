// apps/web/app/admin/device-trust/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AdminDeviceTrustPage: React.FC = () => {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If the device is already trusted, redirect straight to admin
  useEffect(() => {
    let cancelled = false;

    async function checkExisting() {
      try {
        const res = await fetch("/api/admin/device-trust/check", {
          method: "GET",
          cache: "no-store",
        });
        const data = await res.json();

        if (data?.ok) {
          if (!cancelled) {
            router.replace("/admin/requests");
          }
        } else {
          if (!cancelled) {
            setChecking(false);
          }
        }
      } catch (e) {
        console.error("Failed to check admin device trust", e);
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    checkExisting();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleTrust() {
    setError(null);
    setRegistering(true);

    try {
      const res = await fetch("/api/admin/device-trust/register", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to trust this device.");
      }

      router.replace("/admin/requests");
    } catch (e: any) {
      console.error("Failed to register admin device", e);
      setError(e?.message || "Failed to trust this device.");
    } finally {
      setRegistering(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center">
        <p className="text-sm text-neutral-400">
          Checking whether this device is already trusted…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full border border-neutral-800 rounded-2xl p-6 bg-neutral-900/60 shadow-lg">
        <h1 className="text-xl font-semibold mb-2">
          Trust this device for admin access
        </h1>
        <p className="text-sm text-neutral-400 mb-4">
          Runesse admin access is restricted to trusted devices. We will store a
          secure device token in your browser on this machine. Do not do this on
          a shared or public computer.
        </p>

        {error && (
          <div className="mb-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={handleTrust}
          disabled={registering}
          className="w-full rounded-xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-medium hover:bg-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {registering ? "Trusting this device…" : "Yes, trust this device"}
        </button>

        <p className="text-[11px] text-neutral-500 mt-3 leading-relaxed">
          Later we can add extra checks such as OTP or hardware keys. For now,
          this ensures that only your personal devices can open the admin
          dashboard.
        </p>
      </div>
    </div>
  );
};

export default AdminDeviceTrustPage;
