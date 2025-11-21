// apps/web/app/api/requests/complete/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@runesse/db"; // keep same as your other request routes

type RequestStatus =
  | "PENDING"
  | "MATCHED"
  | "COMPLETED"
  | "CANCELLED"
  | string;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null as any);

    const id =
      (body?.id as string | undefined) ||
      (body?.requestId as string | undefined);

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing request id" },
        { status: 400 }
      );
    }

    // 1) Find existing request
    const existing = await prisma.request.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Request not found" },
        { status: 404 }
      );
    }

    const currentStatus = (existing.status || "PENDING").toUpperCase() as RequestStatus;

    // 2) If already completed, just return as-is
    if (currentStatus === "COMPLETED") {
      return NextResponse.json({ ok: true, request: existing });
    }

    // 3) Update ONLY the status for now (no completedAt field)
    const updated = await prisma.request.update({
      where: { id },
      data: {
        status: "COMPLETED",
      },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (err: any) {
    console.error("/api/requests/complete error", err);
    const message =
      err instanceof Error ? err.message : String(err ?? "Unknown error");

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
