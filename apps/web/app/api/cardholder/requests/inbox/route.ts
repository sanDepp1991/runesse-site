// apps/web/app/api/cardholder/requests/inbox/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
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
        { status: 401 },
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

    // 3️⃣ Load ALL pending & unmatched requests (Phase-1 scale is small)
    const pendingRequests = await prisma.request.findMany({
      where: {
        status: "PENDING", // NewRequestStatus.PENDING
        matchedCardholderEmail: null,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // 4️⃣ CARD-MATCHING LOGIC (tolerant and correct)
    //
    // Rules:
    // - If buyer set issuer, card.issuer must EITHER be null (wildcard) OR equal.
    // - If buyer set network, card.network must EITHER be null (wildcard) OR equal.
    // - If buyer set cardLabel, card.label must EITHER be null (wildcard) OR equal.
    //
    // So older saved cards with partial data (issuer/network/label = null)
    // can still match new requests.

    const inboxRequests = pendingRequests.filter((req) => {
      const requestedIssuer = req.requestedIssuer || null;
      const requestedNetwork = req.requestedNetwork || null;
      const requestedLabel = req.requestedCardLabel || null;

      return savedCards.some((card) => {
        const cardIssuer = card.issuer || null;
        const cardNetwork = card.network || null;
        const cardLabel = card.label || null;

        // Issuer check:
        // - If buyer did NOT specify issuer → ignore
        // - If buyer DID specify issuer:
        //     - cardIssuer null → treat as wildcard (allow)
        //     - cardIssuer === requestedIssuer → allow
        //     - else → reject this card
        if (
          requestedIssuer &&
          cardIssuer &&
          cardIssuer !== requestedIssuer
        ) {
          return false;
        }

        // Network check:
        if (
          requestedNetwork &&
          cardNetwork &&
          cardNetwork !== requestedNetwork
        ) {
          return false;
        }

        // Label check (card name/type):
        // Only becomes strict if buyer specified a label AND cardLabel is present.
        if (
          requestedLabel &&
          cardLabel &&
          cardLabel !== requestedLabel
        ) {
          return false;
        }

        // ✅ This card satisfies all constraints
        return true;
      });
    });

    // 5️⃣ "My Taken Requests" — NEVER apply card filtering here
    const myRequests = await prisma.request.findMany({
      where: {
        matchedCardholderEmail: email,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // 6️⃣ Small debug log (safe in dev)
    console.log("[CARDHOLDER_INBOX_DEBUG]", {
      email,
      savedCards: savedCards.length,
      pendingRequests: pendingRequests.length,
      inboxRequests: inboxRequests.length,
      myRequests: myRequests.length,
    });

    // 7️⃣ Return response (both keys for frontend)
    return NextResponse.json(
      {
        ok: true,
        email,
        savedCards,
        inbox: inboxRequests,
        inboxRequests,
        myRequests,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[CARDHOLDER_INBOX_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load cardholder inbox" },
      { status: 500 },
    );
  }
}
