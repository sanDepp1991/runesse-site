// apps/web/app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  LedgerEventType,
  LedgerScope,
} from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";
import { getUserEmailFromRequest } from "../../lib/authServer";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  console.log("🚀 /api/requests POST triggered (web)");

  try {
    const body = await req.json();

    let {
      buyerEmail,
      productLink,
      productName,
      checkoutPrice,
      notes,
      // 🔽 new fields from buyer UI
      requestedIssuer,
      requestedNetwork,
      requestedCardLabel,
    } = body;

    const authEmail = await getUserEmailFromRequest(req);
    const effectiveBuyerEmail = authEmail || buyerEmail;

    if (!effectiveBuyerEmail || typeof effectiveBuyerEmail !== "string") {
      return NextResponse.json(
        { error: "buyerEmail is required (login missing?)" },
        { status: 400 },
      );
    }

    if (!productLink || typeof productLink !== "string") {
      return NextResponse.json(
        { error: "productLink is required." },
        { status: 400 },
      );
    }

    const parsedPrice =
      checkoutPrice === undefined ||
      checkoutPrice === null ||
      checkoutPrice === ""
        ? null
        : Number(checkoutPrice);

    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      return NextResponse.json(
        { error: "checkoutPrice must be a number." },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const reqRow = await tx.request.create({
        data: {
          buyerEmail: effectiveBuyerEmail,
          productLink,
          productName: productName || null,
          checkoutPrice: parsedPrice,
          notes: notes || null,

          // 🔽 store buyer's card preferences
          requestedIssuer: requestedIssuer || null,
          requestedNetwork: requestedNetwork || null,
          requestedCardLabel: requestedCardLabel || null,
        },
      });

      await recordLedgerEntry(tx, {
        eventType: LedgerEventType.REQUEST_CREATED,
        scope: LedgerScope.USER_TRANSACTION,
        referenceType: "REQUEST",
        referenceId: reqRow.id,
        description: "Buyer created a new request",
        meta: {
          buyerEmail: effectiveBuyerEmail,
          productLink,
          productName: productName || null,
          checkoutPrice: parsedPrice,
          requestedIssuer,
          requestedNetwork,
          requestedCardLabel,
        },
      });

      return reqRow;
    });

    return NextResponse.json(
      {
        ok: true,
        request: created,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating request (web):", error);
    return NextResponse.json(
      { error: "Database error while creating request" },
      { status: 500 },
    );
  }
}
