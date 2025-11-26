import { NextResponse } from "next/server";
import {
  PrismaClient,
  LedgerEventType,
  LedgerScope,
} from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";

const prisma = new PrismaClient();

// POST /api/requests
export async function POST(request: Request) {
  console.log("🚀 /api/requests POST triggered (web)");

  try {
    const body = await request.json();

    const {
      buyerEmail,
      productLink,
      productName,
      checkoutPrice,
      notes,
    } = body ?? {};

    // -------- Basic validation (same spirit as your old code) --------
    if (!buyerEmail || typeof buyerEmail !== "string") {
      return NextResponse.json(
        { error: "buyerEmail is required." },
        { status: 400 }
      );
    }

    if (!productLink || typeof productLink !== "string") {
      return NextResponse.json(
        { error: "productLink is required." },
        { status: 400 }
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
        { status: 400 }
      );
    }

    // -------- Create Request + Ledger entry in a single transaction --------
    const created = await prisma.$transaction(async (tx) => {
      // 1) Create the original Request row (Phase-0 model)
      const reqRow = await tx.request.create({
        data: {
          buyerEmail,
          productLink,
          productName: productName || null,
          checkoutPrice: parsedPrice,
          notes: notes || null,
        },
      });

      // 2) Add a LedgerEntry
      await recordLedgerEntry(tx, {
        eventType: LedgerEventType.REQUEST_CREATED,
        scope: LedgerScope.USER_TRANSACTION,
        referenceType: "REQUEST",
        referenceId: reqRow.id,
        // we don’t have buyerId here, just email → keep buyerId null and store email in meta
        description: "Buyer created a new Request (Phase-0 model)",
        meta: {
          buyerEmail,
          productLink,
          productName: productName || null,
          checkoutPrice: parsedPrice,
          notes: notes || null,
        },
      });

      return reqRow;
    });

    return NextResponse.json(
      {
        ok: true,
        request: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating request (web):", error);
    return NextResponse.json(
      { error: "Database error while creating request" },
      { status: 500 }
    );
  }
}
