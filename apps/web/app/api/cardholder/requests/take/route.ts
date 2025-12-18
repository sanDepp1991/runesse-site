import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { LedgerScope, LedgerEventType } from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    let updatedRequest: any = null;

    await prisma.$transaction(async (tx) => {
      // 1) Load existing request
      const existing = await tx.request.findUnique({
        where: { id: requestId },
      });

      if (!existing) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      // Later, when auth is wired, we will use the real logged-in cardholder.
      const matchedCardholderEmail = existing.matchedCardholderEmail ?? null;

      // 2) Update the request as MATCHED (Phase-1 behaviour)
      updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: "MATCHED",
          matchedAt: new Date(),
          // In future: matchedCardholderEmail and cardholderId from auth
        },
      });

      // 3) Write ledger entry for CARDHOLDER_ACCEPTED
      await recordLedgerEntry(tx, {
        scope: LedgerScope.USER_TRANSACTION,
        eventType: LedgerEventType.CARDHOLDER_ACCEPTED,
        side: null,
        amount: null,
        currency: "INR",
        accountKey: "PLATFORM:CARDHOLDER_PHASE1",

        referenceType: "REQUEST",
        referenceId: updatedRequest.id,

        buyerId: null,
        cardholderId: null,
        adminId: null,

        description: "Cardholder accepted request (Phase-1 manual flow)",
        meta: {
          requestId: updatedRequest.id,
          previousStatus: existing.status,
          newStatus: updatedRequest.status,
          buyerEmail: existing.buyerEmail,
          productLink: existing.productLink,
          matchedCardholderEmail,
        },
      });
    });

    return NextResponse.json(
      {
        ok: true,
        request: updatedRequest,
      },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof Error && err.message === "REQUEST_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    console.error("API ERROR /api/cardholder/requests/take:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
