// apps/web/app/api/admin/requests/complete/route.ts

import { NextResponse } from "next/server";
import { prisma, recordLedgerEntry, LedgerScope } from "@runesse/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, requestId } = body || {};

    // Support both { id } and { requestId } just in case
    const targetId: string | undefined = requestId || id;

    if (!targetId || typeof targetId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing request id" },
        { status: 400 }
      );
    }

    // TODO: replace with real admin/user info once auth is in place
    const adminId = "system-complete"; // temporary placeholder

    const updated = await prisma.$transaction(async (tx) => {
      // 1) Fetch existing request
      const existing = await tx.request.findUnique({
        where: { id: targetId },
      });

      if (!existing) {
        throw new Error("Request not found");
      }

      // 2) Update status to COMPLETED (if not already)
      const updatedRequest = await tx.request.update({
        where: { id: targetId },
        data: { status: "COMPLETED" },
      });

      // 3) Log into ledger (recordLedgerEntry expects (tx, args))
      await recordLedgerEntry(tx, {
        scope: LedgerScope.USER_TRANSACTION,
        eventType: "ADMIN_MARKED_COMPLETED",
        referenceType: "REQUEST",
        referenceId: targetId,
        adminId: adminId,
        description: "Admin marked request as COMPLETED",
        meta: {
          requestId: targetId,
          buyerId: null,
          cardholderId: null,
        },
      });

      return updatedRequest;
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    console.error("Complete request error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
