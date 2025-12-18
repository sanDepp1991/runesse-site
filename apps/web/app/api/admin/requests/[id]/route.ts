// apps/web/app/api/admin/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { LedgerScope, LedgerEventType } from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";

type RouteContext = {
  // In Next.js 16, params is a Promise
  params: Promise<{ id: string }>;
};

// ========== GET: load a single request for admin detail ==========
export async function GET(_req: NextRequest, context: RouteContext) {
  // ❗ IMPORTANT: unwrap the Promise
  const { id } = await context.params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid request id" },
      { status: 400 }
    );
  }

  try {
    const request = await prisma.request.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,

        productName: true,
        productLink: true,
        checkoutPrice: true,
        status: true,

        buyerEmail: true,
        matchedCardholderEmail: true,

        buyerCheckoutScreenshotUrl: true,
        buyerProductScreenshotUrl: true,
        cardholderInvoiceUrl: true,
        cardholderCardProofUrl: true,

        requestedIssuer: true,
        requestedNetwork: true,
        requestedCardLabel: true,

        offerPercent: true,
        futureBenefitPercent: true,
        notes: true,
        matchedAt: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, request });
  } catch (err) {
    console.error("[ADMIN_REQUEST_GET_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to load request" },
      { status: 500 }
    );
  }
}

// ========== POST: apply admin actions (approve, mark deposit, mark reimbursed) ==========
export async function POST(req: NextRequest, context: RouteContext) {
  // ❗ IMPORTANT: unwrap the Promise
  const { id } = await context.params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid request id" },
      { status: 400 }
    );
  }

  let action: string | null = null;
  try {
    const body = await req.json();
    action = body?.action || null;
  } catch {
    // ignore parse error → action stays null
  }

  if (!action) {
    return NextResponse.json(
      { ok: false, error: "Missing action" },
      { status: 400 }
    );
  }

  try {
    // ---------- 1) Approve request (make visible to cardholders) ----------
    if (action === "approve") {
      const updated = await prisma.$transaction(async (tx) => {
        const reqRow = await tx.request.update({
          where: { id },
          data: { status: "ADMIN_APPROVED" },
        });

        await recordLedgerEntry(tx, {
          scope: LedgerScope.USER_TRANSACTION,
          eventType: LedgerEventType.ADMIN_APPROVED_REQUEST,
          referenceType: "REQUEST",
          referenceId: reqRow.id,
          accountKey: `REQUEST:${reqRow.id}`,
          description:
            "Admin approved request and made it visible to cardholders",
          meta: {
            requestId: reqRow.id,
            status: reqRow.status,
          },
        });

        return reqRow;
      });

      return NextResponse.json({ ok: true, request: updated });
    }

    // ---------- 2) Mark buyer deposit received (ledger only) ----------
    if (action === "mark-buyer-deposit") {
      await prisma.$transaction(async (tx) => {
        const reqRow = await tx.request.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!reqRow) {
          throw new Error("Request not found");
        }

        await recordLedgerEntry(tx, {
          scope: LedgerScope.USER_TRANSACTION,
          eventType: LedgerEventType.BUYER_DEPOSIT_CONFIRMED,
          referenceType: "REQUEST",
          referenceId: reqRow.id,
          accountKey: `REQUEST:${reqRow.id}`,
          description:
            "Admin marked buyer deposit as received (Phase-1 manual flow)",
          meta: {
            requestId: reqRow.id,
          },
        });
      });

      return NextResponse.json({ ok: true });
    }

    // ---------- 3) Mark cardholder reimbursed (ledger only) ----------
    if (action === "mark-reimbursement") {
      await prisma.$transaction(async (tx) => {
        const reqRow = await tx.request.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!reqRow) {
          throw new Error("Request not found");
        }

        await recordLedgerEntry(tx, {
          scope: LedgerScope.USER_TRANSACTION,
          eventType: LedgerEventType.CARDHOLDER_REIMBURSEMENT_COMPLETED,
          referenceType: "REQUEST",
          referenceId: reqRow.id,
          accountKey: `REQUEST:${reqRow.id}`,
          description:
            "Admin confirmed cardholder reimbursement (Phase-1 manual flow)",
          meta: {
            requestId: reqRow.id,
          },
        });
      });

      return NextResponse.json({ ok: true });
    }

    // Unknown action
    return NextResponse.json(
      { ok: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    console.error("[ADMIN_REQUEST_POST_ACTION_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: "Failed to apply admin action" },
      { status: 500 }
    );
  }
}
