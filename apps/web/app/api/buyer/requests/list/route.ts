// apps/web/app/api/buyer/requests/list/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { getUserEmailFromRequest } from "../../../../lib/authServer";

const BUYER_DEMO_EMAIL = "buyer@demo.runesse";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Try Supabase-authenticated email
    let email = await getUserEmailFromRequest(req);

    // 2️⃣ Fallback to demo email (keeps old behaviour for testing / no login)
    if (!email) {
      email = BUYER_DEMO_EMAIL;
    }

    const items = await prisma.request.findMany({
      where: {
        buyerEmail: email,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(
      {
        ok: true,
        items,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[BUYER_REQUESTS_LIST_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load buyer requests" },
      { status: 500 },
    );
  }
}
