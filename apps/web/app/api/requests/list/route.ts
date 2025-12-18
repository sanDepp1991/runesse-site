import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const requests = await prisma.request.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 🔒 Never leak delivery address/mobile via the public list endpoint.
    const safe = requests.map((r: any) => ({
      ...r,
      deliveryAddressText: null,
      deliveryMobile: null,
    }));

    return NextResponse.json({ ok: true, requests: safe }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/requests/list:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
