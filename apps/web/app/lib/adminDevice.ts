// apps/web/app/lib/adminDevice.ts

import { cookies } from "next/headers";
import { prisma } from "@runesse/db";

export const ADMIN_DEVICE_COOKIE = "runesse_admin_device";
// Phase-1: hardcoded demo admin email
export const ADMIN_EMAIL = "admin@demo.runesse";

/**
 * Returns the trusted AdminDevice row for the current browser (if any),
 * based on the secure cookie value.
 */
export async function getTrustedAdminDevice() {
  // In newer Next.js, cookies() is a dynamic API and must be awaited
  const cookieStore = await cookies();

  const deviceCookie = cookieStore.get(ADMIN_DEVICE_COOKIE);

  if (!deviceCookie?.value) {
    return null;
  }

  const device = await prisma.adminDevice.findFirst({
    where: {
      adminEmail: ADMIN_EMAIL,
      deviceId: deviceCookie.value,
      isRevoked: false,
    },
  });

  if (!device) {
    return null;
  }

  // Optional: update lastSeenAt for basic auditing
  await prisma.adminDevice.update({
    where: { id: device.id },
    data: { lastSeenAt: new Date() },
  });

  return device;
}
