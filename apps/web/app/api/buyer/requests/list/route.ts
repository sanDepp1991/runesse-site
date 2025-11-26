import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";

/**
 * Returns the list of BuyerRequests for our demo buyer
 * in the SAME SHAPE as the old /api/requests/list,
 * so the existing MyRequestsList UI continues to work.
 */
export async function GET() {
  try {
    // Phase-1: fixed demo buyer until auth is ready
    const buyerEmail = "demo-buyer@runesse.local";

    const user = await prisma.user.findUnique({
      where: { email: buyerEmail },
    });

    if (!user) {
      return NextResponse.json({ ok: true, requests: [] });
    }

    const buyerRequests = await prisma.buyerRequest.findMany({
      where: { buyerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Map BuyerRequest -> shape expected by MyRequestsList
    const requests = buyerRequests.map((r) => ({
      id: r.id,
      productName: null, // BuyerRequest doesn't store name yet
      productLink: r.productUrl,
      checkoutPrice: Number(r.checkoutPrice as any),
      status: r.status,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ ok: true, requests });
  } catch (error) {
    console.error("Error listing buyer requests:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load requests" },
      { status: 500 }
    );
  }
}
