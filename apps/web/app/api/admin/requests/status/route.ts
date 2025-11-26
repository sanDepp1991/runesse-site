// apps/web/app/api/admin/requests/status/route.ts

import { NextResponse } from "next/server";
import {
  prisma,
  recordAdminRejectedRequest,
  recordAdminMarkedCompleted,
} from "@runesse/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, newStatus } = body || {};

    // Basic validation
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

    // TODO: Replace with real admin auth once ready
    const adminId = "admin-demo-id";

    const updated = await prisma.$transaction(async (tx) => {
      // 1) Fetch existing request
      const existing = await tx.request.findUnique({
        where: { id: requestId },
      });

      if (!existing) {
        throw new Error("Request not found");
      }

      const finalStatus = newStatus.toUpperCase();

      // 2) Update status on Request table
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: { status: finalStatus },
      });

      // 3) Write admin action into LedgerEntry
      if (finalStatus === "COMPLETED") {
        await recordAdminMarkedCompleted(tx, {
          requestId,
          adminId,
          referenceType: "REQUEST",
          // buyerId/cardholderId unknown on this simple Request table, so null
          buyerId: null,
          cardholderId: null,
        });
      } else if (finalStatus === "CANCELLED") {
        await recordAdminRejectedRequest(tx, {
          requestId,
          adminId,
          referenceType: "REQUEST",
          reason: "Admin cancelled the request",
          buyerId: null,
          cardholderId: null,
        });
      }

      return updatedRequest;
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
