// apps/web/app/api/kyc/pan/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { PanStatus, UserRole } from "@prisma/client";
import { simulatePanVerify } from "../../../../lib/panVerify";
import { getUserEmailFromRequest } from "../../../../lib/authServer";

const BUYER_DEMO_EMAIL = "buyer@demo.runesse";
const CARDHOLDER_DEMO_EMAIL = "cardholder@demo.runesse";

type Body = {
  panNumber: string;
  fullName: string;
  dob: string; // YYYY-MM-DD
  role: UserRole | "BUYER" | "CARDHOLDER";
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const { panNumber, fullName, dob, role } = body;

    if (!panNumber || !fullName || !dob || !role) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields." },
        { status: 400 },
      );
    }

    const normalizedRole =
      role === "CARDHOLDER" ? UserRole.CARDHOLDER : UserRole.BUYER;

    // 1️⃣ Try to use Supabase auth (real logged-in user)
    let email = await getUserEmailFromRequest(req);

    // 2️⃣ Fallback to demo emails if no auth (keeps old behaviour working)
    if (!email) {
      email =
        normalizedRole === UserRole.CARDHOLDER
          ? CARDHOLDER_DEMO_EMAIL
          : BUYER_DEMO_EMAIL;
    }

    // Ensure a user row exists for this email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: normalizedRole,
        },
      });
    }

    const result = await simulatePanVerify({
      panNumber,
      fullName,
      dob,
    });

    if (!result.ok || !result.panMasked || !result.canonicalName) {
      await prisma.user.update({
        where: { email },
        data: {
          panStatus: PanStatus.FAILED,
        },
      });

      return NextResponse.json(
        { ok: false, error: result.error ?? "PAN verification failed." },
        { status: 400 },
      );
    }

    const now = new Date();

    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        panMasked: result.panMasked,
        panStatus: PanStatus.VERIFIED,
        panVerifiedAt: now,
        panName: result.canonicalName,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          email: updatedUser.email,
          panMasked: updatedUser.panMasked,
          panStatus: updatedUser.panStatus,
          panVerifiedAt: updatedUser.panVerifiedAt,
          panName: updatedUser.panName,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PAN verify error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error while verifying PAN." },
      { status: 500 },
    );
  }
}
