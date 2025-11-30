// apps/web/app/api/cardholder/cards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";

const DEFAULT_CARDHOLDER_EMAIL = "cardholder@demo.runesse";

function normalizeEmail(raw?: string | null) {
  return (raw || DEFAULT_CARDHOLDER_EMAIL).trim().toLowerCase();
}

// GET: list all active saved cards
export async function GET(_req: NextRequest) {
  try {
    const cards = await prisma.savedCard.findMany({
      where: { isActive: true },
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

// POST: create a new saved card
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = normalizeEmail(body?.email);

    const bin = String(body?.bin || "").replace(/\D/g, "");
    const last4 = String(body?.last4 || "").replace(/\D/g, "");

    if (bin.length !== 6 || last4.length !== 4) {
      return NextResponse.json(
        { ok: false, error: "BIN (6 digits) and last 4 digits are required." },
        { status: 400 },
      );
    }

    const issuer =
      typeof body?.issuer === "string" && body.issuer.trim().length > 0
        ? body.issuer.trim()
        : null;

    const brand =
      typeof body?.brand === "string" && body.brand.trim().length > 0
        ? body.brand.trim()
        : null;

    const label =
      typeof body?.label === "string" && body.label.trim().length > 0
        ? body.label.trim()
        : null;

    const country =
      typeof body?.country === "string" && body.country.trim().length > 0
        ? body.country.trim().toUpperCase()
        : "IN";

    const network =
      typeof body?.network === "string" && body.network.trim().length > 0
        ? body.network.trim()
        : null;

    const card = await prisma.savedCard.create({
      data: {
        cardholderEmail: email,
        bin,
        last4,
        issuer,
        brand,
        label,
        country,
        network,
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

// DELETE: soft-delete a saved card
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const email = normalizeEmail(url.searchParams.get("email"));

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing card id" },
        { status: 400 },
      );
    }

    const existing = await prisma.savedCard.findUnique({
      where: { id },
    });

    if (!existing || existing.cardholderEmail !== email) {
      return NextResponse.json(
        { ok: false, error: "Card not found" },
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
