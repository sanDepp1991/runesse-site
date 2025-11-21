import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import { supabaseServerClient } from "../../../../../lib/supabaseServer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const requestId = formData.get("requestId");
    const type = formData.get("type");
    const file = formData.get("file");

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    if (!type || typeof type !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing proof type" },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Missing file" },
        { status: 400 }
      );
    }

    if (type !== "buyer-checkout" && type !== "buyer-product") {
      return NextResponse.json(
        { ok: false, error: "Invalid proof type" },
        { status: 400 }
      );
    }

    const existing = await prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    const status = (existing.status || "").toUpperCase();

    // Policy: buyer can upload only while request is PENDING
    if (status !== "PENDING") {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Buyer proofs can only be uploaded while the request is PENDING.",
        },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop() || "bin";
    const safeExt = extension.toLowerCase().slice(0, 8);
    const timestamp = Date.now();

    const bucket = "runesse-proofs";
    const path = `requests/${requestId}/${type}-${timestamp}.${safeExt}`;

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
        { ok: false, error: "Failed to upload file" },
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

    let field: "buyerCheckoutScreenshotUrl" | "buyerProductScreenshotUrl";
    if (type === "buyer-checkout") {
      field = "buyerCheckoutScreenshotUrl";
    } else {
      field = "buyerProductScreenshotUrl";
    }

    const updateData: any = {};
    updateData[field] = publicUrl;

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: updateData,
    });

    return NextResponse.json(
      {
        ok: true,
        url: publicUrl,
        field,
        request: updated,
      },
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
