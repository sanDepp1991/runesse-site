// apps/web/app/api/cardholder/requests/accept/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { NewRequestStatus } from "@prisma/client";
import { getUserEmailFromRequest } from "../../../../lib/authServer";
import { recordCardholderAcceptedRequest } from "@runesse/db/src/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Cardholder identity
    const email = await getUserEmailFromRequest(req);

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated cardholder" },
        { status: 401 }
      );
    }

    // 2️⃣ Read body and tolerate both `requestId` and `id`
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }

    const requestId: string | undefined =
      body?.requestId || body?.id || body?.request_id;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "requestId is required" },
        { status: 400 }
      );
    }

    // 3️⃣ Load the request
    const existing = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Validate status: must be ADMIN_APPROVED and not yet matched
    if (existing.status !== NewRequestStatus.ADMIN_APPROVED) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Request is not available for cardholder. It must be admin-approved and not already taken.",
        },
        { status: 400 }
      );
    }

    if (existing.matchedCardholderEmail) {
      return NextResponse.json(
        { ok: false, error: "This request is already taken by a cardholder." },
        { status: 400 }
      );
    }

    // 5️⃣ Load cardholder’s active saved cards
    const savedCards = await prisma.savedCard.findMany({
      where: {
        cardholderEmail: email,
        isActive: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!savedCards.length) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No active cards found for this cardholder. Please save at least one card.",
        },
        { status: 400 }
      );
    }

    // 6️⃣ Try to pick the best matching card (issuer/network/label)
    const requestedIssuer = (existing.requestedIssuer || "")
      .trim()
      .toUpperCase();
    const requestedNetwork = (existing.requestedNetwork || "")
      .trim()
      .toUpperCase();
    const requestedLabel = (existing.requestedCardLabel || "")
      .trim()
      .toUpperCase();

    const matchingCard =
      savedCards.find((card) => {
        const issuer = (card.issuer || "").trim().toUpperCase();
        const network = (card.network || "").trim().toUpperCase();
        const label = (card.label || "").trim().toUpperCase();

        if (requestedIssuer && issuer !== requestedIssuer) return false;
        if (requestedNetwork && network !== requestedNetwork) return false;
        if (requestedLabel && label !== requestedLabel) return false;

        return true;
      }) || savedCards[0]; // fallback: first card

    // 7️⃣ Update the request as MATCHED to this cardholder (and record ledger)
    const previousStatus = existing.status;

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { email } });

      const updatedReq = await tx.request.update({
        where: { id: requestId },
        data: {
          status: NewRequestStatus.MATCHED,
          matchedCardholderEmail: email,
          matchedCardId: matchingCard.id,
          matchedAt: new Date(),
        },
      });

      // ✅ Ledger: cardholder accepted ("I can take this")
      await recordCardholderAcceptedRequest(tx, {
        requestId,
        cardholderId: user?.id ?? null,
        matchedCardholderEmail: email,
        fromStatus: previousStatus ?? null,
        toStatus: NewRequestStatus.MATCHED,
      });

      return updatedReq;
    });
return NextResponse.json(
      {
        ok: true,
        request: updated,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[CARDHOLDER_ACCEPT_ERROR]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Failed to accept request",
      },
      { status: 500 }
    );
  }
}
