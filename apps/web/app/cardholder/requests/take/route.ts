import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestId = body?.requestId as string | undefined;

    if (!requestId || typeof requestId !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing requestId" },
        { status: 400 }
      );
    }

    // -------- Phase-1: no DB, just a safe mock response --------
    // We simply say "this request is MATCHED" and send it back.
    // The cardholder details page will update its local state
    // with this object.
    const now = new Date().toISOString();

    return NextResponse.json(
      {
        ok: true,
        request: {
          id: requestId,
          status: "MATCHED",
          matchedAt: now,
          // You can add more fields later if needed
        },
      },
      { status: 200 }
    );
    // ------------------------------------------------------------
  } catch (err) {
    console.error("Error in /api/cardholder/requests/take", err);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}
