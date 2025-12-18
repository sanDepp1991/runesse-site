import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { LedgerScope, LedgerEventType } from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";

type AdminPaymentAction =
  | "CONFIRM_BUYER_DEPOSIT"
  | "CONFIRM_CARDHOLDER_REIMBURSEMENT";

interface AdminPaymentBody {
  requestId?: string;
  action?: AdminPaymentAction | string;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as AdminPaymentBody | null;

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { requestId, action } = body;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid requestId." },
        { status: 400 }
      );
    }

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid action." },
        { status: 400 }
      );
    }

    // Normalised account key for this request
    const accountKey = `REQUEST:${requestId}`;

    // ------------------------------------
    // 1) Admin confirms buyer deposit
    // ------------------------------------
    if (action === "CONFIRM_BUYER_DEPOSIT") {
      await recordLedgerEntry(prisma, {
        scope: LedgerScope.USER_TRANSACTION,
        eventType: LedgerEventType.BUYER_DEPOSIT_CONFIRMED,
        referenceType: "REQUEST",
        referenceId: requestId,
        accountKey,
        description:
          "Admin confirmed buyer deposit to Runesse current account (Phase-1 manual flow)",
        meta: {
          action: "CONFIRM_BUYER_DEPOSIT",
          phase: "PHASE_1_MANUAL",
        },
        // money moves outside the app in Phase-1, so we leave side/amount/currency null
      });

      return NextResponse.json({ ok: true });
    }

    // ------------------------------------
    // 2) Admin confirms reimbursement
    // ------------------------------------
if (action === "CONFIRM_CARDHOLDER_REIMBURSEMENT") {
  await recordLedgerEntry(prisma, {
    scope: LedgerScope.USER_TRANSACTION,
    eventType: LedgerEventType.MANUAL_REIMBURSEMENT_COMPLETED, // ✅ Phase-1 manual flow
    referenceType: "REQUEST",
    referenceId: requestId,
    accountKey,
    description:
      "Admin confirmed reimbursement to cardholder (Phase-1 manual flow)",
    meta: {
      action: "CONFIRM_CARDHOLDER_REIMBURSEMENT",
      phase: "PHASE_1_MANUAL",
    },
    // money moves outside the app in Phase-1, so we leave side/amount/currency null
  });

  return NextResponse.json({ ok: true });
}

    // ------------------------------------
    // Unknown action
    // ------------------------------------
    return NextResponse.json(
      { ok: false, error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    console.error("admin payments route error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error while recording payment event." },
      { status: 500 }
    );
  }
}
