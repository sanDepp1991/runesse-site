// apps/web/app/cardholder/requests/take/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { recordCardholderAcceptedRequest } from "@runesse/db/src/ledger";

/**
 * Phase-1 version:
 *
 * - Still behaves like your earlier mock (returns a MATCHED request object)
 * - PLUS it now writes a LedgerEntry with eventType = CARDHOLDER_ACCEPTED
 *
 * Later, when auth & real cardholders are wired in, we can:
 * - Look up the logged-in cardholder
 * - Update the Request row (status, matchedCardholderEmail, matchedAt)
 * - Still reuse the same ledger helper.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null as any);
    const requestId = body?.requestId as string | undefined;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    const now = new Date();

    // For now we don't yet have a real cardholderId (no auth wired),
    // so we only log the fact that SOME cardholder accepted this request.
    await prisma.$transaction(async (tx) => {
      await recordCardholderAcceptedRequest(tx, {
        requestId,
        cardholderId: null, // will be replaced by real user id once auth is added
      });
    });

    // Keep the original mock-style response so your existing UI continues to work.
    return NextResponse.json(
      {
        ok: true,
        request: {
          id: requestId,
          status: "MATCHED",
          matchedAt: now.toISOString(),

          // You can add more fields later (buyerEmail, productLink, etc.)
          // once this endpoint starts reading from the real Request table.
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/cardholder/requests/take", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
