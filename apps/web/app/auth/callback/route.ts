// apps/web/app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServerClient } from "../../../lib/supabaseServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeNextPath(next: string | null): string {
  // Prevent open redirects. Allow only relative paths.
  if (!next) return "/auth";
  if (!next.startsWith("/")) return "/auth";
  return next;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  // Exchange the code for a session (magic link)
  if (code) {
    try {
      const supabase = supabaseServerClient();
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      // If exchange fails, still redirect to /auth (or next),
      // the UI will handle the session state accordingly.
      return NextResponse.redirect(new URL("/auth", url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
