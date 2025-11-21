import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/requests
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      buyerEmail,
      productLink,
      productName,
      checkoutPrice,
      notes,
    } = body ?? {};

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

    const requestRow = await prisma.request.create({
      data: {
        buyerEmail,
        productLink,
        productName: productName || null,
        checkoutPrice: parsedPrice,
        notes: notes || null,
      },
    });

    return NextResponse.json(
      { ok: true, requestId: requestRow.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in POST /api/requests:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
