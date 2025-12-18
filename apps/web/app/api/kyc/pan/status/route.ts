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

    // 1) Try Supabase authenticated email first
    let email = await getUserEmailFromRequest(req);

    // 2) Fallback to demo identity (for unauthenticated/testing)
    if (!email) {
      email =
        normalizedRole === UserRole.CARDHOLDER
          ? CARDHOLDER_DEMO_EMAIL
          : BUYER_DEMO_EMAIL;
    }

    // IMPORTANT:
    // Your schema now includes buyerEnabled/cardholderEnabled.
    // If the DB migration hasn't been applied yet, selecting all columns will throw P2022.
    // So we select only the PAN-related fields here.
    let user: any = null;

    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: {
          email: true,
          role: true,
          panStatus: true,
          panMasked: true,
          panVerifiedAt: true,
          panName: true,
        },
      });
    } catch (e: any) {
      // If DB is missing newly-added columns, Prisma may still throw.
      // In that case, return a clear error so the developer runs the migration.
      if (e?.code === "P2022") {
        return NextResponse.json(
          { ok: false, error: "Database schema is not migrated. Please run Prisma migration." },
          { status: 500 }
        );
      }
      throw e;
    }

    // If never seen this email, create a skeleton user with PENDING PAN
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            email,
            role: normalizedRole,
            panStatus: PanStatus.PENDING,
          },
          select: {
            email: true,
            role: true,
            panStatus: true,
            panMasked: true,
            panVerifiedAt: true,
            panName: true,
          },
        });
      } catch (e: any) {
        if (e?.code === "P2022") {
          return NextResponse.json(
            { ok: false, error: "Database schema is not migrated. Please run Prisma migration." },
            { status: 500 }
          );
        }
        throw e;
      }
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
      { status: 200 }
    );
  } catch (error) {
    console.error("PAN status error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load PAN status" },
      { status: 500 }
    );
  }
}
