// apps/web/app/api/buyer/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  Prisma,
  RequestStatus,
  LedgerEventType,
  LedgerScope,
} from "@prisma/client";
import { recordLedgerEntry } from "@runesse/db/src/ledger";
import { getUserEmailFromRequest } from "../../../lib/authServer";

const prisma = new PrismaClient();

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // ✅ Get buyer identity from your existing auth helper
    const buyerEmail = (await getUserEmailFromRequest(req))?.trim().toLowerCase();

    if (!buyerEmail) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null as any);

    const {
      productLink,
      productName,
      checkoutPrice,
      notes,
      requestedIssuer,
      requestedNetwork,
      requestedCardLabel,

      // ✅ Address fields
      deliveryAddressText,
      deliveryMobile,
    } = body || {};

    // --- Required validations ---
    if (!productLink || typeof productLink !== "string") {
      return NextResponse.json(
        { ok: false, error: "productLink is required" },
        { status: 400 }
      );
    }

    if (!productName || typeof productName !== "string") {
      return NextResponse.json(
        { ok: false, error: "productName is required" },
        { status: 400 }
      );
    }

    const priceNum = Number(checkoutPrice);
    if (!checkoutPrice || Number.isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { ok: false, error: "checkoutPrice must be a valid number" },
        { status: 400 }
      );
    }

    if (!requestedIssuer || typeof requestedIssuer !== "string") {
      return NextResponse.json(
        { ok: false, error: "requestedIssuer is required" },
        { status: 400 }
      );
    }

    if (!requestedNetwork || typeof requestedNetwork !== "string") {
      return NextResponse.json(
        { ok: false, error: "requestedNetwork is required" },
        { status: 400 }
      );
    }

    const cleanAddress =
      typeof deliveryAddressText === "string" ? deliveryAddressText.trim() : "";
    if (!cleanAddress) {
      return NextResponse.json(
        { ok: false, error: "deliveryAddressText is required" },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      // Ensure buyer User exists
      const buyerUser = await tx.user.upsert({
        where: { email: buyerEmail },
        update: {},
        create: { email: buyerEmail, role: "BUYER" },
      });

      // Create request
      const request = await tx.request.create({
        data: {
          buyerEmail,
          productLink: productLink.trim(),
          productName: productName.trim(),
          checkoutPrice: new Prisma.Decimal(priceNum),
          notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,

          requestedIssuer: requestedIssuer.trim(),
          requestedNetwork: requestedNetwork.trim(),
          requestedCardLabel:
            typeof requestedCardLabel === "string" && requestedCardLabel.trim()
              ? requestedCardLabel.trim()
              : null,

          deliveryAddressText: cleanAddress,
          deliveryMobile:
            typeof deliveryMobile === "string" && deliveryMobile.trim()
              ? deliveryMobile.trim()
              : null,

          status: RequestStatus.PENDING,
          offerPercent: null,
          futureBenefitPercent: null,
        },
      });

      // Ledger entry
      await recordLedgerEntry(tx, {
scope: LedgerScope.USER_TRANSACTION,
ledgerScope: LedgerScope.USER_TRANSACTION,
        eventType: LedgerEventType.REQUEST_CREATED,
        side: null,
        amount: null,
        currency: "INR",
        accountKey: null,
        referenceType: "REQUEST",
        referenceId: request.id,
        description: "Buyer created a new request",
        buyerId: buyerUser.id,
        cardholderId: null,
        adminId: null,
        meta: {
          buyerEmail,
          productLink: request.productLink,
          productName: request.productName,
          checkoutPrice: priceNum,
          requestedIssuer: request.requestedIssuer,
          requestedNetwork: request.requestedNetwork,
          requestedCardLabel: request.requestedCardLabel,
          deliveryAddressProvided: true,
          deliveryMobileProvided: Boolean(request.deliveryMobile),
        },
      });

      return request;
    });

    return NextResponse.json({ ok: true, request: created }, { status: 200 });
  } catch (err: any) {
    console.error("[BUYER_REQUEST_CREATE_ERROR]", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Failed to create request" },
      { status: 500 }
    );
  }
}
