// apps/web/app/api/buyer/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  Prisma,
  RequestStatus,
  LedgerEventType,
  LedgerScope,
} from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";

const prisma = new PrismaClient();

/**
 * This API:
 *  - Looks up (or creates) a User using buyerEmail
 *  - Creates a Request row (this is your buyer's request)
 *  - Records a ledger entry for "REQUEST_CREATED"
 *
 * It returns the created Request.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      buyerEmail,
      productLink,
      productName,
      checkoutPrice,
      notes,
    } = body || {};

    // --- Basic validation ---
    if (!buyerEmail || typeof buyerEmail !== "string") {
      return NextResponse.json(
        { success: false, message: "buyerEmail is required" },
        { status: 400 }
      );
    }

    if (!productLink || typeof productLink !== "string") {
      return NextResponse.json(
        { success: false, message: "productLink is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = buyerEmail.trim().toLowerCase();

    const created = await prisma.$transaction(async (tx) => {
      // 1) Ensure we have a User row for the buyer
      const buyerUser = await tx.user.upsert({
        where: { email: normalizedEmail },
        update: {},
        create: {
          email: normalizedEmail,
          role: "BUYER",
        },
      });

      // 2) Create the request
      const request = await tx.request.create({
        data: {
          buyerEmail: normalizedEmail,
          productLink,
          productName: productName || null,
          checkoutPrice: checkoutPrice
            ? new Prisma.Decimal(checkoutPrice)
            : null,
          notes: notes || null,
          status: RequestStatus.PENDING,
          offerPercent: null,
          futureBenefitPercent: null,
        },
      });

      // 3) Record ledger entry for REQUEST_CREATED
      await recordLedgerEntry(tx, {
        scope: LedgerScope.REQUEST,
        eventType: LedgerEventType.REQUEST_CREATED,
        side: null, // NEUTRAL in your schema is represented by null side for now
        amount: null,
        currency: "INR",
        accountKey: null,

        // ✅ IMPORTANT: tie this firmly to the Request row
        referenceType: "REQUEST",
        referenceId: request.id,

        description: "Buyer created a new request",
        buyerId: buyerUser.id,
        cardholderId: null,
        adminId: null,
        meta: {
          buyerEmail: normalizedEmail,
          productLink,
          productName: productName || null,
          checkoutPrice: checkoutPrice ?? null,
        },
      });

      return request;
    });

    return NextResponse.json(
      {
        success: true,
        request: created,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[BUYER_REQUEST_CREATE_ERROR]", err);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create request",
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
