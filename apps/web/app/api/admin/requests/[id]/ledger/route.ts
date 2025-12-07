// apps/web/app/api/admin/requests/[id]/ledger/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";

type RouteParams = {
  id?: string;
  requestId?: string;
  [key: string]: string | undefined;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  try {
    // 1) Unwrap params (Next.js 15: params is a Promise)
    const params = await context.params;

    // 2) Try id / requestId from params
    let requestId = params.id ?? params.requestId ?? "";

    // 3) Fallback: parse from URL in case folder / param name changes
    if (!requestId) {
      const url = new URL(req.url);
      const segments = url.pathname.split("/").filter(Boolean);
      const idx = segments.indexOf("requests");
      if (idx >= 0 && segments[idx + 1]) {
        requestId = segments[idx + 1];
      }
    }

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "Missing request id" },
        { status: 400 }
      );
    }

    // 4) Fetch ledger entries linked to this request
    const items = await prisma.ledgerEntry.findMany({
      where: {
        OR: [
          // Directly linked to the Request
          {
            referenceType: "REQUEST",
            referenceId: requestId,
          },
          // Linked via Transaction whose meta.transaction.requestId matches
          {
            referenceType: "TRANSACTION",
            meta: {
              path: ["transaction", "requestId"],
              equals: requestId,
            },
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
