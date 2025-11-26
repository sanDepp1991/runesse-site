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

// (Optional but safe in Next App Router uploads)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Accept BOTH old + new proof types (so UI mistakes won't break uploads)
const ALLOWED_TYPES = [
  // New (current)
  "cardholder-invoice",
  "cardholder-card-proof",

  // Old (legacy)
  "ch-invoice",
  "ch-card-proof",
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

    // ✅ Normalize legacy → new names so DB field mapping stays consistent
    const normalizedType: AllowedType =
      incomingType === "ch-invoice"
        ? "cardholder-invoice"
        : incomingType === "ch-card-proof"
        ? "cardholder-card-proof"
        : (incomingType as AllowedType);

    if (
      !ALLOWED_TYPES.includes(incomingType as AllowedType) &&
      !ALLOWED_TYPES.includes(normalizedType)
    ) {
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
        matchedCardholderEmail: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    // Allow cardholder uploads only when MATCHED
    const status = (existing.status || "").toUpperCase();
    if (status !== "MATCHED") {
      return NextResponse.json(
        {
          ok: false,
          error: "Proofs can only be uploaded when request is MATCHED",
        },
        { status: 400 }
      );
    }

    // 🔹 Try to use real matchedCardholderEmail, but don't block if it's missing
    const cardholderEmail =
      existing.matchedCardholderEmail || "cardholder+fallback@demo.runesse";

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
      console.error("Supabase upload error (cardholder):", uploadError);
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

    // Map to DB fields (use normalized type) – this is the "latest" URL on Request
    const field =
      normalizedType === "cardholder-invoice"
        ? ("cardholderInvoiceUrl" as const)
        : ("cardholderCardProofUrl" as const);

    // 2) DB: create ProofUpload row + update Request + write LedgerEntry in ONE transaction
    const updated = await prisma.$transaction(async (tx) => {
      // 2a) Ensure cardholder user exists
      let cardholder = await tx.user.findUnique({
        where: { email: cardholderEmail },
      });

      if (!cardholder) {
        cardholder = await tx.user.create({
          data: {
            email: cardholderEmail,
            name: "Cardholder",
            role: UserRole.CARDHOLDER,
          },
        });
      }

      // 2b) Create ProofUpload row
const proof = await tx.proofUpload.create({
  data: {
    id: randomUUID(),
    uploaderId: cardholder.id,
    // For cardholder proofs in Phase-1 we don't link to BuyerRequest yet
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

      // 2d) Ledger entry for this proof upload
      await recordLedgerEntry(tx, {
        scope: LedgerScope.USER_TRANSACTION,
        eventType: LedgerEventType.CARDHOLDER_PROOF_UPLOADED,
        referenceType: "PROOF_UPLOAD",
        referenceId: proof.id,
        buyerId: null,
        cardholderId: cardholder.id,
        accountKey: `USER:${cardholder.id}`,
        description:
          normalizedType === "cardholder-invoice"
            ? "Cardholder uploaded invoice"
            : "Cardholder uploaded card proof",
        meta: {
          requestId: updatedRequest.id,
          proofId: proof.id,
          field,
          publicUrl,
          storagePath: path,
          matchedCardholderEmail: existing.matchedCardholderEmail,
          usedFallbackEmail: !existing.matchedCardholderEmail,
        },
      });

      return updatedRequest;
    });

    return NextResponse.json(
      { ok: true, url: publicUrl, field, request: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/cardholder/proofs/upload:", err);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
