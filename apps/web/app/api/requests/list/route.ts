import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const requests = await prisma.request.findMany({
      orderBy: { createdAt: "desc" },
      // ✅ NO select here — return all fields safely
    });

    return NextResponse.json(
      { ok: true, requests },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/requests/list:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
