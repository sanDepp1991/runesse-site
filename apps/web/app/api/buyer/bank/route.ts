// apps/web/app/api/buyer/bank/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";

const BUYER_DEMO_EMAIL = "buyer@demo.runesse";

function getDemoBuyerIdentity() {
  return {
    userEmail: BUYER_DEMO_EMAIL,
    role: "BUYER" as const,
  };
}

// GET: fetch current buyer's bank account (if any)
export async function GET() {
  try {
    const { userEmail, role } = getDemoBuyerIdentity();

    const account = await prisma.userBankAccount.findFirst({
      where: { userEmail, role },
    });

    return NextResponse.json({ ok: true, account });
  } catch (error) {
    console.error("GET /api/buyer/bank error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to load bank account" },
      { status: 500 },
    );
  }
}

// POST: create or update buyer's bank account
export async function POST(req: NextRequest) {
  try {
    const { userEmail, role } = getDemoBuyerIdentity();

    const body = await req.json();

    const accountHolderName = String(body.accountHolderName || "").trim();
    const accountNumber = String(body.accountNumber || "").trim();
    const ifsc = String(body.ifsc || "").trim().toUpperCase();
    const bankName =
      typeof body.bankName === "string" ? body.bankName.trim() : null;
    const branchName =
      typeof body.branchName === "string" ? body.branchName.trim() : null;

    if (!accountHolderName || !accountNumber || !ifsc) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Account holder name, account number and IFSC are required.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.userBankAccount.findFirst({
      where: { userEmail, role },
    });

    let account;
    if (existing) {
      account = await prisma.userBankAccount.update({
        where: { id: existing.id },
        data: {
          accountHolderName,
          accountNumber,
          ifsc,
          bankName,
          branchName,
          // whenever user edits, push back to PENDING and clear old verification
          status: "PENDING",
          verificationMethod: null,
          lastVerifiedAt: null,
        },
      });
    } else {
      account = await prisma.userBankAccount.create({
        data: {
          userEmail,
          role,
          accountHolderName,
          accountNumber,
          ifsc,
          bankName,
          branchName,
          status: "PENDING",
          verificationMethod: null,
          lastVerifiedAt: null,
        },
      });
    }

    return NextResponse.json({ ok: true, account });
  } catch (error) {
    console.error("POST /api/buyer/bank error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to save bank account" },
      { status: 500 },
    );
  }
}
