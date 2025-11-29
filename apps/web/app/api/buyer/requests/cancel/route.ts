// apps/web/app/api/buyer/requests/cancel/route.ts

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
    const reason = (body?.reason as string | undefined) ?? null;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    let updatedRequest: any = null;

    await prisma.$transaction(async (tx) => {
      const existing = await tx.request.findUnique({
        where: { id: requestId },
      });

      if (!existing) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      // Phase-1 rule (you can relax later):
      // Buyer can cancel only if request is still PENDING.
      if (existing.status !== "PENDING") {
        throw new Error("CANNOT_CANCEL_IN_CURRENT_STATUS");
      }

      updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: "CANCELLED",
        },
      });

      await recordLedgerEntry(tx, {
        scope: LedgerScope.USER_TRANSACTION,
        eventType: LedgerEventType.REQUEST_CANCELLED,
        side: null,
        amount: null,
        currency: "INR",
        accountKey: "USER:BUYER_PHASE1",
        referenceType: "REQUEST",
        referenceId: updatedRequest.id,
        buyerId: null, // later: set from auth
        cardholderId: null,
        adminId: null,
        description: "Buyer cancelled the request (Phase-1 manual flow)",
        meta: {
          requestId: updatedRequest.id,
          previousStatus: existing.status,
          newStatus: updatedRequest.status,
          buyerEmail: existing.buyerEmail,
          reason,
          actor: "BUYER",
        },
      });
    });

    return NextResponse.json(
      { ok: true, request: updatedRequest },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof Error) {
      if (err.message === "REQUEST_NOT_FOUND") {
        return NextResponse.json(
          { ok: false, error: "Request not found" },
          { status: 404 }
        );
      }
      if (err.message === "CANNOT_CANCEL_IN_CURRENT_STATUS") {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Request cannot be cancelled in its current status (already matched or completed).",
          },
          { status: 400 }
        );
      }
    }

    console.error("API ERROR /api/buyer/requests/cancel:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
