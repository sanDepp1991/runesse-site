// apps/web/app/admin/useAdminDeviceGuard.ts
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Checks if current device is trusted for admin.
 * If not, redirects to /admin/device-trust.
 */
export function useAdminDeviceGuard() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/admin/device-trust/check", {
          method: "GET",
          cache: "no-store",
        });
        const data = await res.json();

        if (!data?.ok && !cancelled) {
          router.replace("/admin/device-trust");
        }
      } catch (e) {
        console.error("Failed to check admin device trust", e);
        if (!cancelled) {
          router.replace("/admin/device-trust");
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    check();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return { checking };
}
