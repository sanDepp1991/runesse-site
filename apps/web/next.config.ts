export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Lazy load Prisma only at runtime
    const { prisma } = await import("@runesse/db");

    const envLoaded = Boolean(process.env.RUNESSE_DATABASE_URL);
    const now = await prisma.$queryRaw<{ now: Date }[]>`SELECT NOW()`;

    return NextResponse.json({
      ok: true,
      env: envLoaded ? "loaded" : "missing",
      db: "connected",
      timestamp: now?.[0]?.now ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
