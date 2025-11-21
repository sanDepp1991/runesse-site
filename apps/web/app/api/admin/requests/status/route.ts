import { NextResponse } from "next/server";
import { prisma } from "@runesse/db"; // same import you used in other routes

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, newStatus } = body || {};

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    if (
      !newStatus ||
      !["COMPLETED", "CANCELLED"].includes(newStatus.toUpperCase())
    ) {
      return NextResponse.json(
        { ok: false, error: "Invalid status" },
        { status: 400 }
      );
    }

    // Check request exists
    const existing = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Update status
    const updated = await prisma.request.update({
      where: { id: requestId },
      data: { status: newStatus.toUpperCase() },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
