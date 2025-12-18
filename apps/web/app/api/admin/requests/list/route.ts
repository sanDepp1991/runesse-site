// apps/web/app/api/admin/requests/list/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/requests/list
export async function GET() {
  try {
    const requests = await prisma.request.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        productName: true,
        productLink: true,
        checkoutPrice: true,
        status: true,
        createdAt: true,
        matchedAt: true,
        buyerEmail: true,
        matchedCardholderEmail: true,
      },
    });

    const safe = requests.map((r) => ({
      ...r,
      createdAt: r.createdAt?.toISOString() ?? null,
      matchedAt: r.matchedAt?.toISOString() ?? null,
    }));

    return NextResponse.json({
      ok: true,
      requests: safe,
    });
  } catch (err) {
    console.error("[ADMIN_REQUESTS_LIST_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load requests" },
      { status: 500 }
    );
  }
}
