// apps/web/app/lib/authServer.ts
import { NextRequest } from "next/server";
import { supabaseServerClient } from "./supabaseServer";

/**
 * Reads the Bearer token from the request and returns the
 * Supabase user's email. Returns null if not logged in.
 */
export async function getUserEmailFromRequest(
  req: NextRequest
): Promise<string | null> {
  try {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");

    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return null;
    }

    const token = authHeader.slice("bearer ".length);

    const { data, error } = await supabaseServerClient.auth.getUser(token);

    if (error || !data?.user?.email) {
      console.error("[auth] getUserEmailFromRequest error:", error);
      return null;
    }

    return data.user.email;
  } catch (err) {
    console.error("[auth] getUserEmailFromRequest failed", err);
    return null;
  }
}
