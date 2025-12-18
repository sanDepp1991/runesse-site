import { NextResponse } from "next/server";
import { prisma } from "@runesse/db"; // 👈 same style as your list route

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId } = body || {};

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid requestId" },
        { status: 400 }
      );
    }

    // 1) Check the request exists
    const existing = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { ok: false, error: "Request is no longer available." },
        { status: 400 }
      );
    }

    // 2) Mark as MATCHED
    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        status: "MATCHED",
        matchedCardholderEmail:
          existing.matchedCardholderEmail || "cardholder@demo.runesse",
        matchedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    console.error("Error in /api/requests/match:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
