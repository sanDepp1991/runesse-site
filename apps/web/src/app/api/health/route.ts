export const runtime = "nodejs";

import { prisma } from "@runesse/db";

export async function GET() {
  try {
    const [{ now }] = await prisma.$queryRawUnsafe<{ now: string }[]>("SELECT NOW()");
    return Response.json({ ok: true, db: "connected", timestamp: now });
  } catch (err) {
    console.error("DB connection error:", err);
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
