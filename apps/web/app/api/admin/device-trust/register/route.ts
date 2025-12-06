// apps/web/app/api/admin/device-trust/register/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@runesse/db";
import {
  ADMIN_EMAIL,
  ADMIN_DEVICE_COOKIE,
} from "../../../../lib/adminDevice";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    const deviceId = randomUUID();

    await prisma.adminDevice.create({
      data: {
        adminEmail: ADMIN_EMAIL,
        deviceId,
        label: "Trusted device", // you can extend UI later to collect a custom name
      },
    });

    const res = NextResponse.json({ ok: true });

    // Set secure, HTTP-only cookie for this browser
    res.cookies.set(ADMIN_DEVICE_COOKIE, deviceId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return res;
  } catch (err: any) {
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
