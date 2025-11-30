// apps/web/app/api/buyer/cards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";

// GET: public view of all active saved cards
export async function GET(_req: NextRequest) {
  try {
    const cards = await prisma.savedCard.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        issuer: true,
        brand: true,
        network: true,
        country: true,
        last4: true,
      },
    });

    return NextResponse.json({ ok: true, cards });
  } catch (error) {
    console.error("GET /api/buyer/cards error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error in buyer/cards GET" },
      { status: 500 },
    );
  }
}
