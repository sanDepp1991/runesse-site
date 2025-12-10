// apps/web/app/api/admin/requests/[id]/ledger/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    // In this Next.js version `params` is a Promise – unwrap it.
    const { id } = await context.params;
    const requestId = id;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing or invalid request id.",
        },
        { status: 400 }
      );
    }

    // 🔹 Show *all* ledger entries linked to this request id,
    // regardless of referenceType. This includes:
    // - REQUEST_CREATED, status changes, deposits, reimbursements
    //   (which use referenceType = "REQUEST", referenceId = requestId)
    // - BUYER_PROOF_UPLOADED / CARDHOLDER_PROOF_UPLOADED
    //   (which use referenceType = "PROOF_UPLOAD", referenceId = proof.id,
    //    and store the request id in meta.requestId)
    const entries = await prisma.ledgerEntry.findMany({
      where: {
        OR: [
          {
            referenceType: "REQUEST",
            referenceId: requestId,
          },
          {
            referenceType: "PROOF_UPLOAD",
            meta: {
              path: ["requestId"],
              equals: requestId,
            } as any,
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({
      ok: true,
      items: entries.map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt,
        scope: entry.scope,
        eventType: entry.eventType,
        side: entry.side,
        amount: entry.amount,
        currency: entry.currency,
        description: entry.description,
        meta: entry.meta,
      })),
    });
  } catch (err) {
    console.error("[ADMIN_REQUEST_LEDGER_ERROR]", err);

    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load ledger entries for this request.",
      },
      { status: 500 }
    );
  }
}
