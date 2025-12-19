// apps/web/app/api/cardholder/requests/take-with-card/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { NewRequestStatus } from "@prisma/client";
import { recordCardholderAcceptedRequest } from "@runesse/db/src/ledger";

function normalizeEmail(email: string | null | undefined) {
  return (email || "").trim().toLowerCase() || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const requestId = body?.requestId as string | undefined;
    const savedCardId = body?.savedCardId as string | undefined;

    if (!requestId || !savedCardId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing requestId or savedCardId.",
        },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Load the request
      const request = await tx.request.findUnique({
        where: { id: requestId },
      });

      if (!request) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      // Only allow when request is still PENDING and not yet assigned
      if (
        request.status !== NewRequestStatus.SUBMITTED ||
request.matchedCardholderEmail
      ) {
        // someone already took it / not pending
        throw new Error("REQUEST_NOT_AVAILABLE");
      }

      // 2. Load the saved card
      const savedCard = await tx.savedCard.findUnique({
        where: { id: savedCardId },
      });

      if (!savedCard || !savedCard.isActive) {
        throw new Error("CARD_NOT_AVAILABLE");
      }

      const cardholderEmail = normalizeEmail(savedCard.cardholderEmail);
      if (!cardholderEmail) {
        throw new Error("CARDHOLDER_EMAIL_MISSING");
      }

      // Optional safety: buyer cannot be same as cardholder
      const buyerEmail = normalizeEmail(request.buyerEmail);
      if (buyerEmail && buyerEmail === cardholderEmail) {
        throw new Error("BUYER_AND_CARDHOLDER_SAME");
      }

      // 3. Update the request as MATCHED and attach card + cardholder
      const updated = await tx.request.update({
        where: { id: request.id },
        data: {
          status: NewRequestStatus.MATCHED,
          matchedAt: new Date(),
          matchedCardId: savedCard.id,
          matchedCardholderEmail: cardholderEmail,
        },
      });

      // 4. Record ledger entry for "Cardholder accepted" (user-event style)
      await recordCardholderAcceptedRequest(tx, {
        requestId: updated.id,
        cardholderId: null, // we don't have a separate cardholderId yet
        matchedCardholderEmail: cardholderEmail,
      });

      return updated;
    });

    return NextResponse.json({
      ok: true,
      request: result,
    });
  } catch (err: any) {
    console.error("[CARDHOLDER_TAKE_WITH_CARD_ERROR]", err);

    const code = typeof err?.message === "string" ? err.message : "";

    // Map our internal errors to friendly messages
    if (code === "REQUEST_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "This request no longer exists." },
        { status: 404 }
      );
    }

    if (code === "REQUEST_NOT_AVAILABLE") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This request is no longer available. It may have been taken already.",
        },
        { status: 400 }
      );
    }

    if (code === "CARD_NOT_AVAILABLE") {
      return NextResponse.json(
        {
          ok: false,
          error: "That card is no longer available. Please refresh your page.",
        },
        { status: 400 }
      );
    }

    if (code === "CARDHOLDER_EMAIL_MISSING") {
      return NextResponse.json(
        {
          ok: false,
          error: "Could not determine cardholder email for this card.",
        },
        { status: 400 }
      );
    }

    if (code === "BUYER_AND_CARDHOLDER_SAME") {
      return NextResponse.json(
        {
          ok: false,
          error: "Buyer and cardholder cannot be the same person.",
        },
        { status: 400 }
      );
    }

    // Fallback
    return NextResponse.json(
      {
        ok: false,
        error: "Could not take this request. Please try again.",
      },
      { status: 500 }
    );
  }
}
