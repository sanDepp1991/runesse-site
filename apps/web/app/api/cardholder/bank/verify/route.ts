// apps/web/app/api/cardholder/bank/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { BankAccountStatus, PanStatus } from "@prisma/client";
import { simulatePennyDrop } from "../../../../lib/pennyDrop";
import { getUserEmailFromRequest } from "../../../../lib/authServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CARDHOLDER_DEMO_EMAIL = "cardholder@demo.runesse";

async function resolveCardholderEmail(req: NextRequest): Promise<string> {
  const email = await getUserEmailFromRequest(req);
  return (email || CARDHOLDER_DEMO_EMAIL).trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  try {
    const userEmail = await resolveCardholderEmail(req);
    const role = "CARDHOLDER" as const;

    // 🔒 PAN gating
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, panStatus: true },
    });

    if (!user || user.panStatus !== PanStatus.VERIFIED) {
      return NextResponse.json(
        { ok: false, error: "PAN not verified. Please complete PAN KYC before verifying your bank account." },
        { status: 400 },
      );
    }

    const account = await prisma.userBankAccount.findFirst({
      where: { userEmail, role },
      orderBy: { createdAt: "desc" },
    });

    if (!account) {
      return NextResponse.json({ ok: false, error: "No bank account found. Please save bank details first." }, { status: 404 });
    }

    const result = await simulatePennyDrop({
      accountHolderName: account.accountHolderName,
      accountNumber: account.accountNumber,
      ifsc: account.ifsc,
    });

    const now = new Date();

    if (!result.ok) {
      const updated = await prisma.userBankAccount.update({
        where: { id: account.id },
        data: {
          status: BankAccountStatus.FAILED,
          verificationMethod: "PENNY_DROP",
          lastVerifiedAt: now,
        },
      });

      return NextResponse.json({ ok: false, error: result.error || "Verification failed", account: updated }, { status: 400 });
    }

    const updated = await prisma.userBankAccount.update({
      where: { id: account.id },
      data: {
        status: BankAccountStatus.VERIFIED,
        verificationMethod: "PENNY_DROP",
        lastVerifiedAt: now,
      },
    });

    return NextResponse.json({ ok: true, account: updated });
  } catch (error) {
    console.error("POST /api/cardholder/bank/verify error:", error);
    return NextResponse.json({ ok: false, error: "Bank verification failed" }, { status: 500 });
  }
}
