// apps/web/app/api/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, UserRole } from "@runesse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Roles = {
  buyerEnabled: boolean;
  cardholderEnabled: boolean;
  both: boolean;
};

function rolesFromLegacyEnum(role: UserRole): Roles {
  const buyerEnabled = role === "BUYER" || role === "BOTH";
  const cardholderEnabled = role === "CARDHOLDER" || role === "BOTH";
  return { buyerEnabled, cardholderEnabled, both: buyerEnabled && cardholderEnabled };
}

function computeRoles(u: { role: UserRole; buyerEnabled?: boolean | null; cardholderEnabled?: boolean | null }): Roles {
  const hasFlags =
    typeof u.buyerEnabled === "boolean" || typeof u.cardholderEnabled === "boolean";

  if (hasFlags) {
    const buyerEnabled = !!u.buyerEnabled;
    const cardholderEnabled = !!u.cardholderEnabled;
    // If flags are present but both are false, still fall back to legacy enum (migration period)
    if (!buyerEnabled && !cardholderEnabled) return rolesFromLegacyEnum(u.role);
    return { buyerEnabled, cardholderEnabled, both: buyerEnabled && cardholderEnabled };
  }

  return rolesFromLegacyEnum(u.role);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const email = (url.searchParams.get("email") || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email." }, { status: 400 });
    }

    // First try to read the new boolean flags. If the database hasn't been migrated yet,
    // Prisma will throw P2022 (missing column). In that case, fall back to legacy enum-only read.
    let user: any = null;

    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, buyerEnabled: true, cardholderEnabled: true },
      });
    } catch (e: any) {
      if (e?.code === "P2022") {
        user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, role: true },
        });
      } else {
        throw e;
      }
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }

    const roles = computeRoles(user);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role },
      roles,
    });
  } catch (err: any) {
    console.error("api/me error:", err);
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}
