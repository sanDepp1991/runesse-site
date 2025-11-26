// apps/web/app/api/requests/complete/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";

type RequestStatus =
  | "PENDING"
  | "MATCHED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null as any);

    const id =
      (body?.id as string | undefined) ||
      (body?.requestId as string | undefined);

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing request id" },
        { status: 400 }
      );
    }

    // TODO: replace with real admin/user info once auth is in place
    const adminId = "system-complete"; // temporary placeholder

    const result = await prisma.$transaction(async (tx) => {
      // 1) Find existing request
      const existing = await tx.request.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error("REQUEST_NOT_FOUND");
      }

      const currentStatus = (existing.status || "PENDING")
        .toUpperCase() as RequestStatus;

      // 2) If already completed, just return as-is (no duplicate ledger entry)
      if (currentStatus === "COMPLETED") {
        return existing;
      }

      // 3) Update ONLY the status for now (no completedAt field)
      const updated = await tx.request.update({
        where: { id },
        data: {
          status: "COMPLETED",
        },
      });

      // 4) Directly log into LedgerEntry (ADMIN_MARKED_COMPLETED)
      await tx.ledgerEntry.create({
        data: {
          scope: "USER_TRANSACTION",
          eventType: "ADMIN_MARKED_COMPLETED",
          side: null,
          amount: null,
          currency: "INR",
          accountKey: `REQ:${id}`,
          referenceId: id,
          referenceType: "REQUEST",
          buyerId: null,
          cardholderId: null,
          adminId,
          description: "Admin/system marked request as completed",
          meta: {},
        },
      });

      return updated;
    });

    return NextResponse.json({ ok: true, request: result });
  } catch (err: any) {
    console.error("/api/requests/complete error", err);

    if (err instanceof Error && err.message === "REQUEST_NOT_FOUND") {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    const message =
      err instanceof Error ? err.message : String(err ?? "Unknown error");

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
