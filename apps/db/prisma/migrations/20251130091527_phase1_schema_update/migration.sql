-- CreateEnum
CREATE TYPE "LedgerScope" AS ENUM ('PLATFORM', 'USER_TRANSACTION', 'WALLET', 'ESCROW');

-- CreateEnum
CREATE TYPE "LedgerSide" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerEventType" AS ENUM ('REQUEST_CREATED', 'REQUEST_UPDATED', 'REQUEST_CANCELLED', 'STATUS_CHANGED', 'SYSTEM_AUTO_EXPIRED', 'CARD_SELECTED_FOR_PAYMENT', 'CARDHOLDER_ACCEPTED', 'CARDHOLDER_REJECTED', 'BUYER_PROOF_UPLOADED', 'CARDHOLDER_PROOF_UPLOADED', 'ADMIN_VERIFICATION_PASSED', 'ADMIN_VERIFICATION_FAILED', 'ADMIN_VIEWED_REQUEST', 'ADMIN_APPROVED_REQUEST', 'ADMIN_REJECTED_REQUEST', 'ADMIN_MARKED_COMPLETED', 'MANUAL_REIMBURSEMENT_INITIATED', 'MANUAL_REIMBURSEMENT_COMPLETED', 'ESCROW_FUNDS_HELD', 'ESCROW_FUNDS_RELEASED', 'ESCROW_REFUND_INITIATED', 'ESCROW_REFUND_COMPLETED', 'BUYER_DEPOSIT_CREATED', 'BUYER_DEPOSIT_CONFIRMED', 'CARDHOLDER_REIMBURSEMENT_INITIATED', 'CARDHOLDER_REIMBURSEMENT_COMPLETED', 'RUNESSE_COMMISSION_ACCRUED', 'RUNESSE_COMMISSION_SETTLED', 'ADJUSTMENT', 'NOTE');

-- CreateEnum
CREATE TYPE "NewRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'MATCHED', 'COMPLETED');

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scope" "LedgerScope" NOT NULL,
    "eventType" "LedgerEventType" NOT NULL,
    "side" "LedgerSide",
    "amount" DECIMAL(18,2),
    "currency" TEXT DEFAULT 'INR',
    "accountKey" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "buyerId" TEXT,
    "cardholderId" TEXT,
    "adminId" TEXT,
    "description" TEXT,
    "meta" JSONB,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "buyerCheckoutScreenshotUrl" TEXT,
    "buyerProductScreenshotUrl" TEXT,
    "cardholderInvoiceUrl" TEXT,
    "cardholderCardProofUrl" TEXT,
    "buyerEmail" TEXT NOT NULL,
    "productLink" TEXT NOT NULL,
    "productName" TEXT,
    "checkoutPrice" INTEGER,
    "notes" TEXT,
    "status" "NewRequestStatus" NOT NULL DEFAULT 'PENDING',
    "matchedCardholderEmail" VARCHAR,
    "matchedAt" TIMESTAMP(3),

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCard" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "cardholderEmail" TEXT NOT NULL,
    "bin" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "issuer" TEXT,
    "network" TEXT,
    "brand" TEXT,
    "country" TEXT,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SavedCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerEntry_scope_createdAt_idx" ON "LedgerEntry"("scope", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_referenceType_referenceId_idx" ON "LedgerEntry"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "LedgerEntry_buyerId_idx" ON "LedgerEntry"("buyerId");

-- CreateIndex
CREATE INDEX "LedgerEntry_cardholderId_idx" ON "LedgerEntry"("cardholderId");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountKey_createdAt_idx" ON "LedgerEntry"("accountKey", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_adminId_idx" ON "LedgerEntry"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "Request_buyerEmail_status_idx" ON "Request"("buyerEmail", "status");

-- CreateIndex
CREATE INDEX "SavedCard_cardholderEmail_idx" ON "SavedCard"("cardholderEmail");

-- CreateIndex
CREATE INDEX "SavedCard_cardholderEmail_bin_last4_idx" ON "SavedCard"("cardholderEmail", "bin", "last4");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
