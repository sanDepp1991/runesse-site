import {
  Prisma,
  LedgerEventType,
  LedgerScope,
  LedgerSide,
} from "@prisma/client";

/**
 * We often want to call this helper with either:
 * - the main PrismaClient instance, or
 * - a Prisma.TransactionClient inside a transaction.
 */
export type PrismaClientOrTx =
  | Prisma.TransactionClient
  | Prisma.DefaultPrismaClient;

/**
 * Convenience type for what we can pass into recordLedgerEntry.
 * Amount is optional (for pure operational events).
 */
export interface CreateLedgerEntryInput {
  eventType: LedgerEventType;

  // Optional classification, defaults to USER_TRANSACTION
  scope?: LedgerScope;

  // Financial info (optional for non-money events)
  side?: LedgerSide;
  amount?: Prisma.Decimal | number | string;
  currency?: string; // defaults to "INR" if amount is present

  // Entity linkage
  referenceType?: string; // e.g. "BUYER_REQUEST", "TRANSACTION", "WALLET"
  referenceId?: string;   // the id of that entity

  // Actor info
  buyerId?: string;
  cardholderId?: string;
  adminId?: string;

  // Optional accountKey override
  // e.g. "TX:txId", "USER:buyerId", "PLATFORM_MAIN"
  accountKey?: string;

  // Extra info
  description?: string;
  meta?: Prisma.InputJsonValue;
}

/**
 * Internal helper to compute a sensible default accountKey if caller didn't
 * provide one.
 */
function inferAccountKey(input: CreateLedgerEntryInput): string {
  if (input.accountKey) {
    return input.accountKey;
  }

  if (input.referenceType && input.referenceId) {
    return `${input.referenceType}:${input.referenceId}`;
  }

  if (input.buyerId) {
    return `USER:${input.buyerId}`;
  }

  if (input.cardholderId) {
    return `USER:${input.cardholderId}`;
  }

  // Platform-level catch-all
  return "PLATFORM_MAIN";
}

/**
 * Main helper to record a ledger entry.
 *
 * Usage:
 *   await recordLedgerEntry(prisma, {
 *     eventType: "REQUEST_CREATED",
 *     referenceType: "BUYER_REQUEST",
 *     referenceId: request.id,
 *     buyerId: request.buyerId,
 *     description: "Buyer created a new request",
 *   });
 */
export async function recordLedgerEntry(
  prisma: PrismaClientOrTx,
  input: CreateLedgerEntryInput
) {
  const scope = input.scope ?? LedgerScope.USER_TRANSACTION;
  const accountKey = inferAccountKey(input);

  // If amount is provided but no currency, default to INR
  const currency =
    input.currency ?? (input.amount != null ? "INR" : undefined);

  return prisma.ledgerEntry.create({
    data: {
      scope,
      eventType: input.eventType,
      side: input.side ?? null,
      amount:
        input.amount !== undefined && input.amount !== null
          ? (input.amount as any)
          : null,
      currency: currency ?? null,
      accountKey,

      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,

      buyerId: input.buyerId ?? null,
      cardholderId: input.cardholderId ?? null,
      adminId: input.adminId ?? null,

      description: input.description ?? null,
      meta: input.meta ?? undefined,
    },
  });
}
