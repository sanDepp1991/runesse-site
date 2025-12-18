"use client";

import * as React from "react";
import { supabase } from "./supabaseClient";

type Roles = {
  buyerEnabled: boolean;
  cardholderEnabled: boolean;
  both: boolean;
};

type EnableRole = "BUYER" | "CARDHOLDER";

export type RoleAccessState = {
  loading: boolean;
  error: string | null;

  buyerEnabled: boolean;
  cardholderEnabled: boolean;
  both: boolean;

  // Used for cardholder inbox gating / UI messaging; NOT for role switching.
  cardholderHasSavedCard: boolean;
  setCardholderHasSavedCard: (v: boolean) => void;

  refresh: () => Promise<void>;
  enableRole: (role: EnableRole) => Promise<boolean>;
};

async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

async function getAuthedEmail(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return (data?.session?.user?.email || "").trim().toLowerCase() || null;
}

function safeRoles(r: any): Roles {
  const buyerEnabled = !!r?.buyerEnabled;
  const cardholderEnabled = !!r?.cardholderEnabled;
  return { buyerEnabled, cardholderEnabled, both: buyerEnabled && cardholderEnabled };
}

export function useRoleAccess(): RoleAccessState {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [roles, setRoles] = React.useState<Roles>({
    buyerEnabled: false,
    cardholderEnabled: false,
    both: false,
  });

  const [cardholderHasSavedCard, setCardholderHasSavedCard] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const email = await getAuthedEmail();
      if (!email) {
        setRoles({ buyerEnabled: false, cardholderEnabled: false, both: false });
        return;
      }

      const res = await fetch(`/api/me?email=${encodeURIComponent(email)}`, {
        headers: await getAuthHeaders(),
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load roles");
      }

      setRoles(safeRoles(data.roles));
    } catch (e: any) {
      console.error("useRoleAccess.refresh error:", e);
      setError(e?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  const enableRole = React.useCallback(async (roleToEnable: EnableRole) => {
    setError(null);
    try {
      const email = await getAuthedEmail();
      if (!email) {
        setError("Not signed in.");
        return false;
      }

      const res = await fetch("/api/roles/enable", {
        method: "POST",
        headers: {
          ...(await getAuthHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, roleToEnable }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to enable role");
      }

      setRoles(safeRoles(data.roles));
      return true;
    } catch (e: any) {
      console.error("useRoleAccess.enableRole error:", e);
      setError(e?.message || "Failed to enable role");
      return false;
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    loading,
    error,
    buyerEnabled: roles.buyerEnabled,
    cardholderEnabled: roles.cardholderEnabled,
    both: roles.both,
    cardholderHasSavedCard,
    setCardholderHasSavedCard,
    refresh,
    enableRole,
  };
}
