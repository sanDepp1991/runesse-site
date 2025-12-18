// apps/web/app/api/cardholder/requests/inbox/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { NewRequestStatus } from "@prisma/client";
import { getUserEmailFromRequest } from "../../../../lib/authServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Identify cardholder
    const email = await getUserEmailFromRequest(req);

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Unauthenticated cardholder" },
        { status: 401 }
      );
    }

    // 2️⃣ Load active saved cards of this cardholder
    const savedCards = await prisma.savedCard.findMany({
      where: {
        cardholderEmail: email,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3️⃣ Load ALL unmatched, ADMIN-APPROVED requests (Phase-1 scale is small)
    const pendingRequests = await prisma.request.findMany({
      where: {
        matchedCardholderEmail: null,
        // 🔒 Only show requests that admin has approved
        status: NewRequestStatus.ADMIN_APPROVED,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // 4️⃣ CARD-MATCHING LOGIC
    //
    // Rules:
    // - If buyer set issuer, card.issuer must EQUAL
    // - If buyer set network, card.network must EQUAL
    // - If buyer set label, card.label must EQUAL (case-insensitive)
    //
    // Tolerant: if buyer left some fields null, we do not filter on them.
    const inboxRequests = pendingRequests.filter((req) => {
      const requestedIssuer = (req.requestedIssuer || "")
        .trim()
        .toUpperCase();
      const requestedNetwork = (req.requestedNetwork || "")
        .trim()
        .toUpperCase();
      const requestedLabel = (req.requestedCardLabel || "")
        .trim()
        .toUpperCase();

      return savedCards.some((card) => {
        const issuer = (card.issuer || "").trim().toUpperCase();
        const network = (card.network || "").trim().toUpperCase();
        const label = (card.label || "").trim().toUpperCase();

        if (requestedIssuer && issuer !== requestedIssuer) return false;
        if (requestedNetwork && network !== requestedNetwork) return false;
        if (requestedLabel && label !== requestedLabel) return false;

        return true;
      });
    });

    // 5️⃣ "My requests" = anything already matched to this cardholder
    const myRequests = await prisma.request.findMany({
      where: {
        matchedCardholderEmail: email,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json(
      {
        ok: true,
        savedCards,
        inbox: inboxRequests,
        inboxRequests, // kept for compatibility with any existing frontend usage
        myRequests,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[CARDHOLDER_INBOX_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load cardholder inbox" },
      { status: 500 }
    );
  }
}
