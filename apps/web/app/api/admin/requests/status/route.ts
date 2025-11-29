// apps/web/app/api/admin/requests/status/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { LedgerScope, LedgerEventType } from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, newStatus, reason } = body || {};

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
      const eventType =
        finalStatus === "COMPLETED"
          ? LedgerEventType.ADMIN_MARKED_COMPLETED
          : LedgerEventType.ADMIN_REJECTED_REQUEST;

      await recordLedgerEntry(tx, {
        scope: LedgerScope.USER_TRANSACTION,
        eventType,
        referenceType: "REQUEST",
        referenceId: requestId,
        buyerId: null,
        cardholderId: null,
        adminId,
        accountKey: adminId ? `ADMIN:${adminId}` : null,
        description:
          finalStatus === "COMPLETED"
            ? "Admin marked request as completed"
            : "Admin cancelled the request",
        meta: {
          previousStatus: existing.status,
          newStatus: finalStatus,
          actor: "ADMIN",
          reason:
            finalStatus === "CANCELLED"
              ? reason || "Admin cancelled the request"
              : undefined,
        },
      });

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
