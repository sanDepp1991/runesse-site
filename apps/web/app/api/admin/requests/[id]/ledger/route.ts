// apps/web/app/api/admin/requests/[id]/ledger/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";

type RouteParams = {
  id?: string;
  requestId?: string;
  [key: string]: string | undefined;
};

export async function GET(
  req: Request,
  context: { params: RouteParams }
) {
  try {
    // 1) Try params.id or params.requestId
    let requestId =
      context.params?.id || context.params?.requestId || "";

    // 2) Fallback: parse from URL in case folder name is different
    if (!requestId) {
      const url = new URL(req.url);
      const parts = url.pathname.split("/").filter(Boolean);
      // .../api/admin/requests/<id>/ledger
      const idx = parts.indexOf("requests");
      if (idx !== -1 && parts[idx + 1]) {
        requestId = parts[idx + 1];
      }
    }

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing request id" },
        { status: 400 }
      );
    }

    const items = await prisma.ledgerEntry.findMany({
      where: {
        OR: [
          // Events directly tied to the Request
          {
            referenceType: "REQUEST",
            referenceId: requestId,
          },
          // Buyer / cardholder proof uploads where meta.requestId = this request
          {
            referenceType: "PROOF_UPLOAD",
            // JSON path filter – TS needs a little help here
            meta: {
              path: ["requestId"],
              equals: requestId,
            } as any,
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("Error in /api/admin/requests/[id]/ledger:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
