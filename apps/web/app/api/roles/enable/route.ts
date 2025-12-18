// apps/web/app/api/roles/enable/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma, UserRole } from "@runesse/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EnableRole = "BUYER" | "CARDHOLDER";

function nextRole(current: UserRole, buyerEnabled: boolean, cardholderEnabled: boolean): UserRole {
  const b = buyerEnabled || current === "BUYER" || current === "BOTH";
  const c = cardholderEnabled || current === "CARDHOLDER" || current === "BOTH";
  if (b && c) return "BOTH";
  if (b) return "BUYER";
  if (c) return "CARDHOLDER";
  return current;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { email?: string; roleToEnable?: EnableRole }
      | null;

    const email = (body?.email || "").trim().toLowerCase();
    const roleToEnable = body?.roleToEnable;

    if (!email || !roleToEnable) {
      return NextResponse.json(
        { ok: false, error: "Missing email or roleToEnable." },
        { status: 400 }
      );
    }

    // Read only minimal columns. If DB migration isn't applied yet, buyerEnabled/cardholderEnabled
    // columns may be missing; in that case we fall back to legacy enum-only behavior.
    let user: any = null;
    let hasRoleFlags = true;

    try {
      user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, buyerEnabled: true, cardholderEnabled: true },
      });
    } catch (e: any) {
      if (e?.code === "P2022") {
        hasRoleFlags = false;
        user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true },
        });
      } else {
        throw e;
      }
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
    }

    const buyerEnabled =
      (hasRoleFlags ? !!user.buyerEnabled : false) ||
      user.role === "BUYER" ||
      user.role === "BOTH" ||
      roleToEnable === "BUYER";

    const cardholderEnabled =
      (hasRoleFlags ? !!user.cardholderEnabled : false) ||
      user.role === "CARDHOLDER" ||
      user.role === "BOTH" ||
      roleToEnable === "CARDHOLDER";

    const newRole = nextRole(user.role, buyerEnabled, cardholderEnabled);

    // Update: if role flags exist, update both flags + enum.
    // If flags do not exist yet, update only legacy enum so the app still works.
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: hasRoleFlags
          ? { buyerEnabled, cardholderEnabled, role: newRole }
          : { role: newRole },
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

    // Keep profile.role in sync if profile exists (ignore if the profile table isn't used)
    try {
      await prisma.userProfile.update({
        where: { userId: user.id },
        data: { role: newRole },
      });
    } catch {
      // no-op (profile may not exist)
    }

    return NextResponse.json({
      ok: true,
      roles: { buyerEnabled, cardholderEnabled, both: buyerEnabled && cardholderEnabled },
      role: newRole,
    });
  } catch (err: any) {
    console.error("api/roles/enable error:", err);
    return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
  }
}
