// apps/web/app/api/buyer/cards/available/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";

export async function GET() {
  try {
    const cards = await prisma.savedCard.findMany({
      where: {
        isActive: true,
      },
      distinct: ["issuer", "network", "label"],
      orderBy: [
        { issuer: "asc" },
        { label: "asc" },
      ],
    });

    return NextResponse.json(
      {
        ok: true,
        cards,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[BUYER_AVAILABLE_CARDS_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load available cards" },
      { status: 500 },
    );
  }
}
