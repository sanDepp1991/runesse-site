// apps/web/app/api/cardholder/cards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { getUserEmailFromRequest } from "../../../lib/authServer";

const DEFAULT_CARDHOLDER_EMAIL = "cardholder@demo.runesse";

/**
 * Utility – normalise an email, falling back to demo cardholder for local/dev.
 */
function normalizeEmail(raw?: string | null): string {
  return (raw || DEFAULT_CARDHOLDER_EMAIL).trim().toLowerCase();
}

// GET: list all active saved cards for the current cardholder
export async function GET(req: NextRequest) {
  try {
    const authedEmail = await getUserEmailFromRequest(req);
    const email = normalizeEmail(authedEmail);

    const cards = await prisma.savedCard.findMany({
      where: {
        isActive: true,
        cardholderEmail: email,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, cards });
  } catch (error) {
    console.error("GET /api/cardholder/cards error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error in cardholder/cards GET" },
      { status: 500 },
    );
  }
}

// POST: create a new saved card for this cardholder
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const authedEmail = await getUserEmailFromRequest(req);
    // For local testing we allow an optional body.email, but in real flows
    // the Supabase-authenticated email will be used.
    const email = normalizeEmail(authedEmail ?? body?.email);

    let bin: string = typeof body.bin === "string" ? body.bin : "";
    let last4: string = typeof body.last4 === "string" ? body.last4 : "";
    const issuer: string | null =
      typeof body.issuer === "string" && body.issuer.trim().length > 0
        ? body.issuer.trim()
        : null;
    const brand: string | null =
      typeof body.brand === "string" && body.brand.trim().length > 0
        ? body.brand.trim()
        : null;
    const network: string | null =
      typeof body.network === "string" && body.network.trim().length > 0
        ? body.network.trim()
        : null;
    const country: string | null =
      typeof body.country === "string" && body.country.trim().length > 0
        ? body.country.trim()
        : null;
    const label: string | null =
      typeof body.label === "string" && body.label.trim().length > 0
        ? body.label.trim()
        : null;

    // Normalise BIN and last4 – keep only digits.
    bin = bin.replace(/\D/g, "").slice(0, 8);
    last4 = last4.replace(/\D/g, "").slice(0, 4);

    if (!bin || bin.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Please enter at least the first 6 digits of the card." },
        { status: 400 },
      );
    }

    if (!last4 || last4.length !== 4) {
      return NextResponse.json(
        { ok: false, error: "Please enter the last 4 digits of the card." },
        { status: 400 },
      );
    }

    const card = await prisma.savedCard.create({
      data: {
        cardholderEmail: email,
        bin,
        last4,
        issuer,
        brand,
        network,
        country,
        label,
      },
    });

    return NextResponse.json({ ok: true, card });
  } catch (error) {
    console.error("POST /api/cardholder/cards error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error in cardholder/cards POST" },
      { status: 500 },
    );
  }
}

// DELETE: soft-delete (deactivate) a saved card – only if it belongs to this cardholder
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const id: string | undefined = body?.id;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Card id is required to delete a card." },
        { status: 400 },
      );
    }

    const authedEmail = await getUserEmailFromRequest(req);
    const email = normalizeEmail(authedEmail ?? body?.email);

    const existing = await prisma.savedCard.findUnique({ where: { id } });

    if (!existing || normalizeEmail(existing.cardholderEmail) !== email) {
      // Either not found or does not belong to this user
      return NextResponse.json(
        { ok: false, error: "Card not found." },
        { status: 404 },
      );
    }

    await prisma.savedCard.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/cardholder/cards error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error in cardholder/cards DELETE" },
      { status: 500 },
    );
  }
}
