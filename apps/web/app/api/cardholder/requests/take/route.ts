import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";   // ← SAME IMPORT STYLE

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = body?.requestId;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    // Step 1: Find the request
    const existing = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Step 2: Validate status (only PENDING can be taken)
    if (
      existing.status === "MATCHED" ||
      existing.status === "COMPLETED" ||
      existing.status === "CANCELLED"
    ) {
      return NextResponse.json(
        { ok: false, error: "Request is not available to take" },
        { status: 400 }
      );
    }

    // Step 3: Update status to MATCHED
    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "MATCHED",
        matchedAt: new Date(),
        // In future: matchedCardholderId and matchedCardholderEmail from auth session
      },
    });

    return NextResponse.json({ ok: true, request: updated }, { status: 200 });
  } catch (err) {
    console.error("API ERROR /api/cardholder/requests/take:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
