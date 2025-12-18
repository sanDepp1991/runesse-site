import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
  }

// Strict: DB-backed existence check requires RUNESSE_DATABASE_URL
if (!process.env.RUNESSE_DATABASE_URL) {
  return NextResponse.json(
    {
      ok: false,
      code: "MISSING_DB_URL",
      error:
        "Server is not configured. Set RUNESSE_DATABASE_URL in apps/web/.env.local (and/or apps/db/.env) then restart pnpm dev:web.",
    },
    { status: 500 }
  );
}

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, exists: !!user });
  } catch (e) {
    console.error("auth/exists error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
