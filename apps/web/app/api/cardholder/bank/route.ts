// apps/web/app/api/cardholder/bank/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { getUserEmailFromRequest } from "../../../lib/authServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CARDHOLDER_DEMO_EMAIL = "cardholder@demo.runesse";

async function resolveCardholderEmail(req: NextRequest): Promise<string> {
  const email = await getUserEmailFromRequest(req);
  return (email || CARDHOLDER_DEMO_EMAIL).trim().toLowerCase();
}

// GET: fetch current cardholder's bank account (if any)
export async function GET(req: NextRequest) {
  try {
    const userEmail = await resolveCardholderEmail(req);
    const role = "CARDHOLDER" as const;

    const account = await prisma.userBankAccount.findFirst({
      where: { userEmail, role },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, account });
  } catch (error) {
    console.error("GET /api/cardholder/bank error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load bank account" }, { status: 500 });
  }
}

// POST: upsert cardholder's bank account
export async function POST(req: NextRequest) {
  try {
    const userEmail = await resolveCardholderEmail(req);
    const role = "CARDHOLDER" as const;

    const body = await req.json();
    const accountHolderName = String(body?.accountHolderName || "").trim();
    const accountNumber = String(body?.accountNumber || "").trim();
    const ifsc = String(body?.ifsc || "").trim().toUpperCase();
    const bankName = body?.bankName ? String(body.bankName).trim() : null;
    const branchName = body?.branchName ? String(body.branchName).trim() : null;

    if (!accountHolderName || !accountNumber || !ifsc) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existing = await prisma.userBankAccount.findFirst({
      where: { userEmail, role },
      orderBy: { createdAt: "desc" },
    });

    const account = existing
      ? await prisma.userBankAccount.update({
          where: { id: existing.id },
          data: {
            accountHolderName,
            accountNumber,
            ifsc,
            bankName,
            branchName,
            status: "PENDING",
            verificationMethod: null,
            lastVerifiedAt: null,
          },
        })
      : await prisma.userBankAccount.create({
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

    return NextResponse.json({ ok: true, account });
  } catch (error) {
    console.error("POST /api/cardholder/bank error:", error);
    return NextResponse.json({ ok: false, error: "Failed to save bank account" }, { status: 500 });
  }
}
