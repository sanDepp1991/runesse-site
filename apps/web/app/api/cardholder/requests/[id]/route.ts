// apps/web/app/api/cardholder/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { getUserEmailFromRequest } from "../../../../lib/authServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const email = await getUserEmailFromRequest(req);

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const requestId = id;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Invalid request id" },
        { status: 400 }
      );
    }

    const request = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    const status = (request.status || "").toString().toUpperCase();

    const canSeeAddress =
      status === "MATCHED" &&
      (request.matchedCardholderEmail || "").toLowerCase() ===
        email.toLowerCase();

    // ✅ Enforce Phase-1 visibility rule at API level
    const safeRequest: any = {
      ...request,
      deliveryAddressText: canSeeAddress ? request.deliveryAddressText : null,
      deliveryMobile: canSeeAddress ? request.deliveryMobile : null,
    };

    return NextResponse.json(
      { ok: true, request: safeRequest, canSeeAddress },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[CARDHOLDER_REQUEST_GET_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
