// apps/web/app/api/cardholder/bank/verify/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { BankAccountStatus, PanStatus } from "@prisma/client";
import { simulatePennyDrop } from "../../../../lib/pennyDrop";

const CARDHOLDER_DEMO_EMAIL = "cardholder@demo.runesse";

export async function POST() {
  try {
    const userEmail = CARDHOLDER_DEMO_EMAIL;
    const role = "CARDHOLDER" as const;

    // 🔒 PAN gating: cardholder must have PAN_STATUS = VERIFIED
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user || user.panStatus !== PanStatus.VERIFIED) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "PAN not verified. Please complete PAN KYC before verifying your bank account.",
        },
        { status: 403 }
      );
    }

    const account = await prisma.userBankAccount.findFirst({
      where: { userEmail, role },
    });

    if (!account) {
      return NextResponse.json(
        { ok: false, error: "No bank account found to verify" },
        { status: 400 }
      );
    }

    if (account.status === BankAccountStatus.VERIFIED) {
      return NextResponse.json(
        { ok: true, alreadyVerified: true, account },
        { status: 200 }
      );
    }

    const result = await simulatePennyDrop({
      accountNumber: account.accountNumber,
      ifsc: account.ifsc,
      accountHolderName: account.accountHolderName,
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

      return NextResponse.json(
        {
          ok: false,
          error: result.error || "Verification failed",
          account: updated,
        },
        { status: 200 }
      );
    }

    const updated = await prisma.userBankAccount.update({
      where: { id: account.id },
      data: {
        status: BankAccountStatus.VERIFIED,
        verificationMethod: "PENNY_DROP",
        lastVerifiedAt: now,
      },
    });

    return NextResponse.json({ ok: true, account: updated }, { status: 200 });
  } catch (error) {
    console.error("POST /api/cardholder/bank/verify error:", error);
    return NextResponse.json(
      { ok: false, error: "Bank verification failed (server error)" },
      { status: 500 }
    );
  }
}
