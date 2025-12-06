// apps/web/app/api/cardholder/requests/accept/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { LedgerEventType, LedgerScope } from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";
import { getUserEmailFromRequest } from "../../../../lib/authServer";

const CARDHOLDER_DEMO_EMAIL = "cardholder@demo.runesse";

type Body = {
  requestId: string;
  cardId?: string | null; // future: specific saved card
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { requestId, cardId } = body;

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "requestId is required" },
        { status: 400 },
      );
    }

    // 1️⃣ Determine cardholder email
    let cardholderEmail = await getUserEmailFromRequest(req);
    if (!cardholderEmail) {
      cardholderEmail = CARDHOLDER_DEMO_EMAIL;
    }

    // 2️⃣ Ensure request exists and is still open
    const existing = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 },
      );
    }

    if (existing.status !== "PENDING" || existing.matchedCardholderEmail) {
      return NextResponse.json(
        { ok: false, error: "Request is no longer available" },
        { status: 400 },
      );
    }

    // 3️⃣ Match this request to the cardholder
    const now = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const reqRow = await tx.request.update({
        where: { id: requestId },
        data: {
          matchedCardholderEmail: cardholderEmail,
          matchedCardId: cardId ?? null, // future card-based logic
          matchedAt: now,
          status: "MATCHED",
        },
      });

      await recordLedgerEntry(tx, {
        eventType: LedgerEventType.CARDHOLDER_ACCEPTED,
        scope: LedgerScope.USER_TRANSACTION,
        referenceType: "REQUEST",
        referenceId: reqRow.id,
        description: "Cardholder accepted this request",
        meta: {
          cardholderEmail,
          cardId: cardId ?? null,
        },
      });

      return reqRow;
    });

    return NextResponse.json(
      {
        ok: true,
        request: updated,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[CARDHOLDER_ACCEPT_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to accept request" },
      { status: 500 },
    );
  }
}
