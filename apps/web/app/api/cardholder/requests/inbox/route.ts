// apps/web/app/api/cardholder/requests/inbox/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { getUserEmailFromRequest } from "../../../../lib/authServer";

const CARDHOLDER_DEMO_EMAIL = "cardholder@demo.runesse";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Get cardholder email from Supabase auth (or fallback to demo)
    let email = await getUserEmailFromRequest(req);
    if (!email) {
      email = CARDHOLDER_DEMO_EMAIL;
    }

    // 2️⃣ Active saved cards for this cardholder
    const savedCards = await prisma.savedCard.findMany({
      where: {
        cardholderEmail: email,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 3️⃣ Eligible inbox = open requests (PENDING) not yet matched
    //    and not created by this cardholder themselves
    const inboxRequests = await prisma.request.findMany({
      where: {
        status: "PENDING",
        matchedCardholderEmail: null,
        buyerEmail: {
          not: email,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 4️⃣ My requests = requests already matched to this cardholder
    const myRequests = await prisma.request.findMany({
      where: {
        matchedCardholderEmail: email,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        email,
        savedCards,
        inboxRequests,
        myRequests,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[CARDHOLDER_INBOX_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load cardholder requests" },
      { status: 500 },
    );
  }
}
