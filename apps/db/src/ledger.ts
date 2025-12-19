// apps/db/src/ledger.ts

import {
  Prisma,
  LedgerScope,
  LedgerEventType,
  LedgerSide,
} from "@prisma/client";

/**
 * Shape of data we accept for a generic ledger entry.
 *
 * Most fields are optional so we can use the same helper
 * for both operational events and real money movements later.
 */
export interface RecordLedgerEntryArgs {
  // Required (canonical)
  scope: LedgerScope;
  eventType: LedgerEventType;

  // Optional backwards-compat keys (some routes may send this by mistake)
  // We accept it to avoid breaking existing code paths.
  ledgerScope?: LedgerScope;

  // Optional financial side
  side?: LedgerSide | null;
  amount?: Prisma.Decimal | number | null;
  currency?: string | null;

  // Generic account key: e.g. "PLATFORM_MAIN", "USER:<id>", "TX:<id>"
  accountKey?: string | null;

  // Business references
  referenceType?: string | null; // e.g. "REQUEST", "DEPOSIT_INTENT"
  referenceId?: string | null;

  // Actor references
  buyerId?: string | null;
  cardholderId?: string | null;
  adminId?: string | null;

  // Human-readable description
  description?: string | null;

  // Arbitrary metadata (JSON)
  meta?: Prisma.InputJsonValue | null;

  // Optional alias for meta (tolerate naming mismatches)
  metadata?: Prisma.InputJsonValue | null;
}

/**
 * Generic helper to write a ledger entry.
 *
 * Always call this **inside** a prisma.$transaction(async (tx) => { ... })
 * and pass the transaction client as `tx`.
 */
export async function recordLedgerEntry(
  tx: Prisma.TransactionClient,
  args: RecordLedgerEntryArgs
) {
  // ✅ Normalize scope: accept both `scope` (canonical) and `ledgerScope` (legacy/mistake)
  const scopeValue = args.scope ?? args.ledgerScope;

  if (!scopeValue) {
    // Fail fast with an explicit message (better than Prisma validation error)
    throw new Error(
      "recordLedgerEntry: scope is required (missing `scope` / `ledgerScope`)."
    );
  }

  const {
    eventType,
    side,
    amount,
    currency,
    accountKey,
    referenceType,
    referenceId,
    buyerId,
    cardholderId,
    adminId,
    description,
    meta,
    metadata,
  } = args;

  // Normalise amount to Prisma.Decimal if needed
  let amountValue: Prisma.Decimal | null = null;
  if (amount !== undefined && amount !== null) {
    amountValue =
      amount instanceof Prisma.Decimal ? amount : new Prisma.Decimal(amount);
  }

  // ✅ Normalize meta: accept both `meta` and `metadata`
  const metaValue = meta ?? metadata ?? undefined;

  await tx.ledgerEntry.create({
    data: {
      scope: scopeValue,
      eventType,
      side: side ?? null,
      amount: amountValue,
      currency: currency ?? (amountValue ? "INR" : null),

      accountKey: accountKey ?? null,

      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,

      buyerId: buyerId ?? null,
      cardholderId: cardholderId ?? null,
      adminId: adminId ?? null,

      description: description ?? null,
      meta: metaValue,
    },
  });
}

/**
 * Convenience helper:
 * Record that a cardholder accepted a request ("I can take this").
 *
 * This is purely an operational event for now – no money movement yet.
 *
 * Usage:
 *   await recordCardholderAcceptedRequest(tx, { requestId, cardholderId });
 */
export async function recordCardholderAcceptedRequest(
  tx: Prisma.TransactionClient,
  args: {
    requestId: string;
    cardholderId?: string | null;
    matchedCardholderEmail?: string | null;
    fromStatus?: string | null;
    toStatus?: string | null;
  }
) {
  const {
    requestId,
    cardholderId,
    matchedCardholderEmail,
    fromStatus,
    toStatus,
  } = args;

  await recordLedgerEntry(tx, {
    scope: LedgerScope.USER_TRANSACTION,
    eventType: LedgerEventType.CARDHOLDER_ACCEPTED,

    // No money movement yet
    side: null,
    amount: null,
    currency: "INR",

    accountKey: cardholderId
      ? `USER:${cardholderId}`
      : "PLATFORM:CARDHOLDER_UNIDENTIFIED",

    referenceType: "REQUEST",
    referenceId: requestId,

    buyerId: null,
    cardholderId: cardholderId ?? null,
    adminId: null,

    description: "Cardholder accepted the request for payment",
    meta: {
      requestId,
      cardholderId: cardholderId ?? null,
      matchedCardholderEmail: matchedCardholderEmail ?? null,
      fromStatus: fromStatus ?? null,
      toStatus: toStatus ?? null,
    },
  });
}

/**
 * Convenience helper:
 * Record that an admin marked a request as completed.
 *
 * This exists because the admin app imports `recordAdminMarkedCompleted`
 * from `@runesse/db`.
 *
 * Usage:
 *   await recordAdminMarkedCompleted(tx, { requestId, adminId, meta });
 */
export async function recordAdminMarkedCompleted(
  tx: Prisma.TransactionClient,
  args: {
    requestId: string;
    adminId?: string | null;
    meta?: Prisma.InputJsonValue | null;
  }
) {
  const { requestId, adminId, meta } = args;

  await recordLedgerEntry(tx, {
    scope: LedgerScope.USER_TRANSACTION,
    eventType: LedgerEventType.ADMIN_MARKED_COMPLETED,

    side: null,
    amount: null,
    currency: "INR",

    accountKey: adminId ? `USER:${adminId}` : "PLATFORM:ADMIN_UNIDENTIFIED",

    referenceType: "REQUEST",
    referenceId: requestId,

    buyerId: null,
    cardholderId: null,
    adminId: adminId ?? null,

    description: "Admin marked request completed",
    meta: (meta ?? { requestId, adminId: adminId ?? null }) as any,
  });
}
