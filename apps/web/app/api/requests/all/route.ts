import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";

export async function GET() {
  try {
    const requests = await prisma.request.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      ok: true,
      requests,
    });
  } catch (error) {
    console.error("[GET /api/requests/all] Failed to load requests", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to load requests",
      },
      { status: 500 }
    );
  }
}
