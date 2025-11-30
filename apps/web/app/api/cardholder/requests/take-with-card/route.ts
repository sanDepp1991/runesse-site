import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";

const DEFAULT_CARDHOLDER_EMAIL = "cardholder@demo.runesse";

function normalizeEmail(raw?: string | null) {
  return (raw || DEFAULT_CARDHOLDER_EMAIL).trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null as any);

    const requestId =
      typeof body?.requestId === "string" ? body.requestId : null;
    const savedCardId =
      typeof body?.savedCardId === "string" ? body.savedCardId : null;

    const cardholderEmail = normalizeEmail(body?.cardholderEmail);

    if (!requestId || !savedCardId) {
      return NextResponse.json(
        { ok: false, error: "requestId and savedCardId are required" },
        { status: 400 },
      );
    }

    // 1) Load request
    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 },
      );
    }

    if (request.status !== "PENDING") {
      return NextResponse.json(
        {
          ok: false,
          error: "Only PENDING requests can be taken by a cardholder",
        },
        { status: 400 },
      );
    }

    // 2) Load and validate card
    const card = await prisma.savedCard.findUnique({
      where: { id: savedCardId },
    });

    if (!card || !card.isActive) {
      return NextResponse.json(
        { ok: false, error: "Card not found or inactive" },
        { status: 404 },
      );
    }

    if (card.cardholderEmail !== cardholderEmail) {
      return NextResponse.json(
        { ok: false, error: "This card does not belong to you" },
        { status: 403 },
      );
    }

    // 3) Update request → MATCHED + attach card
    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "MATCHED",
        matchedCardholderEmail: cardholderEmail,
        matchedAt: new Date(),
        matchedCardId: card.id,
      },
    });

    return NextResponse.json({ ok: true, request: updated, card });
  } catch (error) {
    console.error("POST /api/cardholder/requests/take-with-card error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 },
    );
  }
}
