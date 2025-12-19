// apps/web/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const ADMIN_APP_URL =
  process.env.NEXT_PUBLIC_ADMIN_APP_URL?.trim() || "https://admin.runesse.com";

function isLocalHost(host: string) {
  // covers localhost, 127.0.0.1, and typical LAN access like 192.168.x.x
  const h = host.toLowerCase();
  return (
    h.includes("localhost") ||
    h.startsWith("127.0.0.1") ||
    h.startsWith("0.0.0.0") ||
    h.startsWith("192.168.") ||
    h.startsWith("10.") ||
    h.startsWith("172.16.") ||
    h.startsWith("172.17.") ||
    h.startsWith("172.18.") ||
    h.startsWith("172.19.") ||
    h.startsWith("172.2") || // covers 172.20.x.x – 172.29.x.x
    h.startsWith("172.3") // covers 172.30.x.x – 172.31.x.x
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only redirect /admin to the admin subdomain when NOT running locally.
  // This fixes local `next start` where /admin should be served by apps/web.
  if (pathname === "/admin") {
    const host = req.headers.get("host") || "";
    if (!isLocalHost(host)) {
      return NextResponse.redirect(ADMIN_APP_URL, 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin"],
};
