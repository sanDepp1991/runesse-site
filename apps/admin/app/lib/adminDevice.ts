// apps/web/app/lib/adminDevice.ts

import { cookies } from "next/headers";
import { prisma } from "@runesse/db";

export const ADMIN_DEVICE_COOKIE = "runesse_admin_device";

// Phase-1: single hard-coded admin.
// Change this to your real admin email:
export const ADMIN_EMAIL = "admin@runesse.com";

/**
 * Returns the trusted AdminDevice row for the current browser (if any),
 * based on the device cookie.
 */
export async function getTrustedAdminDevice() {
  // In Next 15/16, cookies() is async
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

  // Optional: basic audit trail
  await prisma.adminDevice.update({
    where: { id: device.id },
    data: { lastSeenAt: new Date() },
  });

  return device;
}
