// apps/web/app/api/kyc/pan/status/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { PanStatus, UserRole } from "@prisma/client";
import { getUserEmailFromRequest } from "../../../../lib/authServer";

const BUYER_DEMO_EMAIL = "buyer@demo.runesse";
const CARDHOLDER_DEMO_EMAIL = "cardholder@demo.runesse";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role") || "BUYER";

    const normalizedRole =
      roleParam === "CARDHOLDER" ? UserRole.CARDHOLDER : UserRole.BUYER;

    // 1️⃣ Try Supabase authenticated email first
    let email = await getUserEmailFromRequest(req);

    // 2️⃣ Fallback to demo identity (for unauthenticated/testing)
    if (!email) {
      email =
        normalizedRole === UserRole.CARDHOLDER
          ? CARDHOLDER_DEMO_EMAIL
          : BUYER_DEMO_EMAIL;
    }

    let user = await prisma.user.findUnique({
      where: { email },
    });

    // If never seen this email, create a skeleton user with PENDING PAN
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: normalizedRole,
          panStatus: PanStatus.PENDING,
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        user: {
          email: user.email,
          panStatus: user.panStatus,
          panMasked: user.panMasked,
          panVerifiedAt: user.panVerifiedAt,
          panName: user.panName,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PAN status error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load PAN status" },
      { status: 500 },
    );
  }
}
