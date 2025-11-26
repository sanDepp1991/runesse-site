import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { supabaseServerClient } from "../../../../../lib/supabaseServer";
import {
  LedgerScope,
  LedgerEventType,
  UserRole,
} from "@prisma/client";
import { randomUUID } from "crypto";
import { recordLedgerEntry } from "@runesse/db/src/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accept BOTH strict + alias names to be tolerant of UI
const ALLOWED_TYPES = [
  // Canonical buyer upload types
  "buyer-checkout",
  "buyer-product",

  // Aliases (legacy / UI mistakes)
  "buyer-checkout-screenshot",
  "buyer-product-page",
] as const;

type AllowedType = (typeof ALLOWED_TYPES)[number];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const requestIdRaw = formData.get("requestId");
    const typeRaw = formData.get("type");
    const proofTypeRaw = formData.get("proofType");
    const fileRaw = formData.get("file");

    const requestId =
      typeof requestIdRaw === "string" ? requestIdRaw : null;

    // prefer "type", fallback to "proofType"
    const incomingType =
      (typeof typeRaw === "string" && typeRaw) ||
      (typeof proofTypeRaw === "string" && proofTypeRaw) ||
      "";

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    if (!incomingType) {
      return NextResponse.json(
        { ok: false, error: "Missing proof type" },
        { status: 400 }
      );
    }

    if (!fileRaw || !(fileRaw instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 }
      );
    }

    // Normalize aliases → canonical
    let normalizedType: AllowedType;
    switch (incomingType) {
      case "buyer-checkout-screenshot":
        normalizedType = "buyer-checkout";
        break;
      case "buyer-product-page":
        normalizedType = "buyer-product";
        break;
      default:
        normalizedType = incomingType as AllowedType;
        break;
    }

    if (!ALLOWED_TYPES.includes(normalizedType)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Invalid proof type: ${incomingType}`,
        },
        { status: 400 }
      );
    }

    const existing = await prisma.request.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        status: true,
        buyerEmail: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Buyer uploads allowed while request is PENDING or MATCHED
    const status = (existing.status || "").toUpperCase();
    if (!["PENDING", "MATCHED"].includes(status)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Buyer proofs can only be uploaded while the request is PENDING or MATCHED",
        },
        { status: 400 }
      );
    }

    // Try to use real buyer email, fallback for safety
    const buyerEmail =
      existing.buyerEmail || "buyer+fallback@demo.runesse";

    const file = fileRaw;
    const originalName = file.name || "upload";
    const ext = originalName.includes(".")
      ? originalName.split(".").pop()!
      : "bin";

    const safeExt =
      ext.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
    const timestamp = Date.now();

    const bucket = "runesse-proofs";
    const path = `requests/${requestId}/${normalizedType}-${timestamp}.${safeExt}`;

    // 1) Upload file to Supabase storage
    const { error: uploadError } = await supabaseServerClient.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error("Supabase upload error (buyer):", uploadError);
      return NextResponse.json(
        { ok: false, error: uploadError.message || "Failed to upload file" },
        { status: 500 }
      );
    }

    const { data: publicData } = supabaseServerClient.storage
      .from(bucket)
      .getPublicUrl(path);

    const publicUrl = publicData?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json(
        { ok: false, error: "Could not obtain public URL" },
        { status: 500 }
      );
    }

    // Map to DB fields – this is the "latest" URL on Request
    const field =
      normalizedType === "buyer-checkout"
        ? ("buyerCheckoutScreenshotUrl" as const)
        : ("buyerProductScreenshotUrl" as const);

    // 2) In one transaction: ensure User, insert ProofUpload, update Request, write Ledger
    const updated = await prisma.$transaction(async (tx) => {
      // 2a) Ensure buyer user exists
      let buyer = await tx.user.findUnique({
        where: { email: buyerEmail },
      });

      if (!buyer) {
        buyer = await tx.user.create({
          data: {
            email: buyerEmail,
            name: "Buyer",
            role: UserRole.BUYER,
          },
        });
      }

      // 2b) Create ProofUpload row
      const proof = await tx.proofUpload.create({
        data: {
          id: randomUUID(),
          uploaderId: buyer.id,
          // At this stage we don't link to BuyerRequest yet
          buyerRequestId: null,
          transactionId: null,
          kind: normalizedType,
          s3Key: path,
          mimeType: file.type || null,
          sizeBytes: typeof file.size === "number" ? file.size : null,
          // scanStatus uses default PENDING
        },
      });

      // 2c) Update Request with latest URL
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: { [field]: publicUrl },
      });

      // 2d) Ledger entry for this buyer proof upload
      await recordLedgerEntry(tx, {
        scope: LedgerScope.USER_TRANSACTION,
        eventType: LedgerEventType.BUYER_PROOF_UPLOADED,
        referenceType: "PROOF_UPLOAD",
        referenceId: proof.id,
        buyerId: buyer.id,
        cardholderId: null,
        accountKey: `USER:${buyer.id}`,
        description:
          normalizedType === "buyer-checkout"
            ? "Buyer uploaded checkout screenshot"
            : "Buyer uploaded product page screenshot",
        meta: {
          requestId: updatedRequest.id,
          proofId: proof.id,
          field,
          publicUrl,
          storagePath: path,
          buyerEmail: existing.buyerEmail,
          usedFallbackEmail: !existing.buyerEmail,
        },
      });

      return updatedRequest;
    });

    return NextResponse.json(
      { ok: true, url: publicUrl, field, request: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/buyer/proofs/upload:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
