// apps/web/app/api/buyer/deposits/upload/route.ts

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
    const amountRaw = body?.amount as number | string | undefined;
    const currency = (body?.currency as string | undefined) ?? "INR";
    const method = (body?.method as string | undefined) ?? null; // UPI / NEFT / RTGS etc.
    const utr = (body?.utr as string | undefined) ?? null;
    const paidAtIso = (body?.paidAt as string | undefined) ?? null;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    if (amountRaw === undefined || amountRaw === null || amountRaw === "") {
      return NextResponse.json(
        { ok: false, error: "Missing amount" },
        { status: 400 }
      );
    }

    const amount = typeof amountRaw === "string" ? Number(amountRaw) : amountRaw;
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const existing = await tx.request.findUnique({
        where: { id: requestId },
      });

      if (!existing) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      await recordLedgerEntry(tx, {
        scope: LedgerScope.USER_TRANSACTION,
        eventType: LedgerEventType.BUYER_DEPOSIT_CREATED, // ✅ matches Prisma
        side: null,
        amount,
        currency,
        accountKey: "USER:BUYER_PHASE1",
        referenceType: "REQUEST",
        referenceId: existing.id,
        buyerId: null, // later from auth
        cardholderId: null,
        adminId: null,
        description: "Buyer reported deposit to Runesse current account",
        meta: {
          requestId: existing.id,
          buyerEmail: existing.buyerEmail,
          method,
          utr,
          paidAt: paidAtIso,
        },
      });
    });

    return NextResponse.json(
      { ok: true, message: "Buyer deposit recorded in ledger" },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof Error && err.message === "REQUEST_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    console.error("API ERROR /api/buyer/deposits/upload:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
