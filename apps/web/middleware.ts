import { NextRequest, NextResponse } from "next/server";

/**
 * Admin UI must be hosted separately.
 * This middleware prevents the main web app from serving /admin routes.
 *
 * When you get the real admin URL, set:
 *   NEXT_PUBLIC_ADMIN_APP_URL=https://<your-admin-domain>
 */
export function middleware(req: NextRequest) {
  const adminBase =
    process.env.NEXT_PUBLIC_ADMIN_APP_URL?.trim() || "https://admin.runesse.com";

  // Preserve the requested path after /admin
  const url = req.nextUrl;
  const pathAfterAdmin = url.pathname.replace(/^\/admin/, "") || "/";
  const target = new URL(adminBase);
  target.pathname = pathAfterAdmin;
  target.search = url.search;

  return NextResponse.redirect(target.toString());
}

export const config = {
  matcher: ["/admin/:path*"],
};
