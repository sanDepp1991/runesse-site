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
 *  - Creates a BuyerRequest
 *  - Writes a LedgerEntry with eventType = REQUEST_CREATED
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

    if (
      checkoutPrice === undefined ||
      checkoutPrice === null ||
      isNaN(Number(checkoutPrice))
    ) {
      return NextResponse.json(
        { success: false, message: "checkoutPrice must be a number" },
        { status: 400 }
      );
    }

    const checkoutPriceDecimal = new Prisma.Decimal(checkoutPrice);

    // For Phase-1, treat statedBenefit and otherCharges as 0
    const statedBenefitDecimal = new Prisma.Decimal(0);
    const otherChargesDecimal = new Prisma.Decimal(0);

    const buyerRequest = await prisma.$transaction(async (tx) => {
      // 1) Find or create user by email
      let user = await tx.user.findUnique({
        where: { email: buyerEmail },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email: buyerEmail,
            name: "Demo Buyer",
            role: "BUYER",
          },
        });
      }

      // 2) Create BuyerRequest
      const created = await tx.buyerRequest.create({
        data: {
          buyerId: user.id,
          productUrl: productLink,
          paymentLink: productLink, // placeholder until separate payment link exists
          checkoutPrice: checkoutPriceDecimal,
          statedBenefit: statedBenefitDecimal,
          otherCharges: otherChargesDecimal,
          status: RequestStatus.PENDING_ADMIN_APPROVAL,
        },
      });

      // 3) Ledger entry
      await recordLedgerEntry(tx, {
        eventType: LedgerEventType.REQUEST_CREATED,
        scope: LedgerScope.USER_TRANSACTION,
        referenceType: "BUYER_REQUEST",
        referenceId: created.id,
        buyerId: user.id,
        description: "Buyer created a new request",
        meta: {
          productLink,
          productName,
          checkoutPrice: checkoutPriceDecimal.toString(),
          notes: notes || null,
        },
      });

      return created;
    });

    return NextResponse.json(
      {
        success: true,
        data: buyerRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating buyer request:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientValidationError
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Database error while creating request",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error while creating request",
      },
      { status: 500 }
    );
  }
}
