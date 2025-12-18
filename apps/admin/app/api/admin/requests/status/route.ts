// apps/web/app/api/admin/requests/status/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { LedgerScope, LedgerEventType, NewRequestStatus } from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";

// TODO: replace with real admin identity once admin auth is wired
const DEMO_ADMIN_ID = "admin-demo-id";

type AdminStatusInput =
  | "SUBMITTED"
  | "ADMIN_APPROVED"
  | "MATCHED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

const ALLOWED_TARGET_STATUSES: AdminStatusInput[] = [
  "ADMIN_APPROVED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

// Simple state machine – what admin is allowed to do
function canTransition(from: NewRequestStatus, to: AdminStatusInput): boolean {
  const f = from.toUpperCase();
  const t = to.toUpperCase();

  // SUBMITTED → ADMIN_APPROVED / REJECTED / CANCELLED
  if (f === "SUBMITTED") {
    return t === "ADMIN_APPROVED" || t === "REJECTED" || t === "CANCELLED";
  }

  // ADMIN_APPROVED → COMPLETED / REJECTED / CANCELLED
  if (f === "ADMIN_APPROVED") {
    return t === "COMPLETED" || t === "REJECTED" || t === "CANCELLED";
  }

  // MATCHED → COMPLETED / CANCELLED
  if (f === "MATCHED") {
    return t === "COMPLETED" || t === "CANCELLED";
  }

  // COMPLETED / REJECTED / CANCELLED are terminal
  return false;
}

function eventTypeFor(target: AdminStatusInput): LedgerEventType {
  if (target === "ADMIN_APPROVED") return LedgerEventType.ADMIN_APPROVED_REQUEST;
  if (target === "COMPLETED") return LedgerEventType.ADMIN_MARKED_COMPLETED;
  if (target === "REJECTED") return LedgerEventType.ADMIN_REJECTED_REQUEST;
  if (target === "CANCELLED") return LedgerEventType.REQUEST_CANCELLED;
  return LedgerEventType.STATUS_CHANGED;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) ?? {};
    const { requestId, newStatus, reason } = body as {
      requestId?: string;
      newStatus?: string;
      reason?: string | null;
    };

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    if (!newStatus || typeof newStatus !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing newStatus" },
        { status: 400 }
      );
    }

    const upper = newStatus.toUpperCase() as AdminStatusInput;

    if (!ALLOWED_TARGET_STATUSES.includes(upper)) {
      return NextResponse.json({ ok: false, error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Request not found" }, { status: 404 });
    }

    const currentStatus = existing.status as NewRequestStatus;

    if ((currentStatus || "").toUpperCase() === upper) {
      return NextResponse.json({ ok: true, request: existing });
    }

    if (!canTransition(currentStatus, upper)) {
      return NextResponse.json(
        { ok: false, error: `Cannot change status from ${currentStatus} to ${upper}` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: { status: upper },
      });

      await recordLedgerEntry(tx, {
        // NOTE: LedgerScope.REQUEST does not exist in this codebase; use USER_TRANSACTION for request-scoped events.
        scope: LedgerScope.USER_TRANSACTION,
        eventType: eventTypeFor(upper),
        referenceType: "REQUEST",
        referenceId: requestId,
        adminId: DEMO_ADMIN_ID,
        description:
          upper === "ADMIN_APPROVED"
            ? "Admin approved request (now visible to cardholders)."
            : upper === "COMPLETED"
            ? "Admin marked request as completed."
            : upper === "REJECTED"
            ? `Admin rejected request${reason ? `: ${reason}` : ""}`
            : `Admin cancelled request${reason ? `: ${reason}` : ""}`,
        meta: {
          previousStatus: currentStatus,
          newStatus: upper,
          reason: reason ?? null,
        },
      });

      return updatedRequest;
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (error) {
    console.error("[ADMIN_STATUS_ERROR]", error);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
