// apps/web/app/api/admin/device-trust/register/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import {
  ADMIN_DEVICE_COOKIE,
  ADMIN_EMAIL,
} from "../../../../lib/adminDevice";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    const deviceId = randomUUID();

    await prisma.adminDevice.create({
      data: {
        adminEmail: ADMIN_EMAIL,
        deviceId,
        label: "Trusted device",
      },
    });

    const res = NextResponse.json({ ok: true });

    // IMPORTANT:
    //  - In dev (http://localhost:3000) => secure must be false,
    //    otherwise the browser will silently drop the cookie.
    //  - In production (https://app.runesse.com) => secure true.
    const isProduction = process.env.NODE_ENV === "production";

    res.cookies.set(ADMIN_DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return res;
  } catch (err) {
    console.error("[ADMIN_DEVICE_REGISTER_ERROR]", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to register admin device",
      },
      { status: 500 }
    );
  }
}
