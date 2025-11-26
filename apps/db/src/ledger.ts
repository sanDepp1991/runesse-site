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
  // Required
  scope: LedgerScope;
  eventType: LedgerEventType;

  // Optional financial side
  side?: LedgerSide | null;
  amount?: Prisma.Decimal | number | null;
  currency?: string | null;

  // Generic account key: e.g. "PLATFORM_MAIN", "USER:<id>", "TX:<id>"
  accountKey?: string | null;

  // Business references
  referenceId?: string | null; // e.g. buyerRequestId, transactionId, walletId
  referenceType?: string | null; // e.g. "BUYER_REQUEST", "TRANSACTION", "WALLET"

  // Actors
  buyerId?: string | null;
  cardholderId?: string | null;
  adminId?: string | null; // who performed/approved the action (if applicable)

  // Description + extra JSON
  description?: string | null;
  meta?: Record<string, any> | null;
}

/**
 * Shared low-level helper for writing a LedgerEntry row.
 *
 * Always call this **inside** a prisma.$transaction(async (tx) => { ... })
 * and pass the transaction client as `tx`.
 */
export async function recordLedgerEntry(
  tx: Prisma.TransactionClient,
  args: RecordLedgerEntryArgs
) {
  const {
    scope,
    eventType,
    side,
    amount,
    currency,
    accountKey,
    referenceId,
    referenceType,
    buyerId,
    cardholderId,
    adminId,
    description,
    meta,
  } = args;

  // Normalise amount to Prisma.Decimal if needed
  let amountValue: Prisma.Decimal | null = null;
  if (amount !== undefined && amount !== null) {
    amountValue =
      amount instanceof Prisma.Decimal ? amount : new Prisma.Decimal(amount);
  }

  await tx.ledgerEntry.create({
    data: {
      scope,
      eventType,
      side: side ?? null,
      amount: amountValue,
      currency: currency ?? "INR",
      accountKey: accountKey ?? null,
      referenceId: referenceId ?? null,
      referenceType: referenceType ?? null,
      buyerId: buyerId ?? null,
      cardholderId: cardholderId ?? null,
      adminId: adminId ?? null,
      description: description ?? null,
      meta: meta ?? undefined, // Prisma will store as Json
    },
  });
}

/**
 * Convenience helper: log when a cardholder uploads proof
 * (invoice + card proof etc.) for a given BuyerRequest.
 *
 * Use this from the proof-upload API inside a transaction:
 *
 *   await recordCardholderProofUploaded(tx, { ... });
 */
export async function recordCardholderProofUploaded(
  tx: Prisma.TransactionClient,
  args: {
    buyerRequestId: string;
    cardholderId: string;
    proofUploadId: string;
    adminId?: string | null; // optional, for later manual verification
  }
) {
  const { buyerRequestId, cardholderId, proofUploadId, adminId } = args;

  await recordLedgerEntry(tx, {
    scope: LedgerScope.USER_TRANSACTION,
    eventType: LedgerEventType.CARDHOLDER_PROOF_UPLOADED,

    referenceType: "PROOF_UPLOAD",
    referenceId: proofUploadId,

    buyerId: null,
    cardholderId,
    adminId: adminId ?? null,

    // No money movement yet in Phase-1 (manual payments)
    side: null,
    amount: null,
    currency: "INR",

    accountKey: `USER:${cardholderId}`,

    description: "Cardholder uploaded proof for buyer request",
    meta: {
      buyerRequestId,
      proofUploadId,
    },
  });
}
