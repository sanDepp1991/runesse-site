// apps/web/app/api/admin/device-trust/check/route.ts

import { NextResponse } from "next/server";
import { getTrustedAdminDevice } from "../../../../lib/adminDevice";

export async function GET() {
  try {
    const device = await getTrustedAdminDevice();

    if (!device) {
      return NextResponse.json({ ok: false });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ADMIN_DEVICE_CHECK_ERROR]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
