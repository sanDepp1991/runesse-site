// apps/web/app/api/admin/reimbursements/record/route.ts

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
    const method = (body?.method as string | undefined) ?? null; // NEFT / IMPS / UPI etc.
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
        eventType: LedgerEventType.MANUAL_REIMBURSEMENT_COMPLETED, // ✅ matches Prisma
        side: null,
        amount,
        currency,
        accountKey: "PLATFORM:RUNESSE_CURRENT_ACCOUNT",
        referenceType: "REQUEST",
        referenceId: existing.id,
        buyerId: null,
        cardholderId: null, // later from auth / KYC
        adminId: null,
        description: "Admin recorded reimbursement to cardholder (manual Phase-1)",
        meta: {
          requestId: existing.id,
          buyerEmail: existing.buyerEmail,
          matchedCardholderEmail: existing.matchedCardholderEmail,
          method,
          utr,
          paidAt: paidAtIso,
        },
      });
    });

    return NextResponse.json(
      { ok: true, message: "Cardholder reimbursement recorded in ledger" },
      { status: 200 }
    );
  } catch (err: any) {
    if (err instanceof Error && err.message === "REQUEST_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    console.error("API ERROR /api/admin/reimbursements/record:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
