-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING_ADMIN_APPROVAL', 'APPROVED', 'REJECTED', 'AWAITING_CARDHOLDER_PAYMENT', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('AWAITING_CARDHOLDER_PAYMENT', 'AWAITING_ADMIN_VERIFICATION', 'SETTLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BUYER', 'CARDHOLDER', 'BOTH');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactionId" TEXT,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerRequest" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "productUrl" TEXT NOT NULL,
    "paymentLink" TEXT NOT NULL,
    "checkoutPrice" DECIMAL(12,2) NOT NULL,
    "statedBenefit" DECIMAL(12,2) NOT NULL,
    "otherCharges" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING_ADMIN_APPROVAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardholderOffer" (
    "id" TEXT NOT NULL,
    "cardholderId" TEXT NOT NULL,
    "binPrefix" TEXT,
    "issuer" TEXT,
    "network" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardholderOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProofUpload" (
    "id" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "buyerRequestId" TEXT,
    "transactionId" TEXT,
    "kind" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "scanStatus" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProofUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "buyerRequestId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'manual',
    "amountPayable" DECIMAL(12,2) NOT NULL,
    "status" "TxStatus" NOT NULL DEFAULT 'AWAITING_CARDHOLDER_PAYMENT',
    "paymentRef" TEXT,
    "escrowStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BUYER',
    "trustedDeviceHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "BuyerRequest_buyerId_status_idx" ON "BuyerRequest"("buyerId", "status");

-- CreateIndex
CREATE INDEX "CardholderOffer_cardholderId_active_idx" ON "CardholderOffer"("cardholderId", "active");

-- CreateIndex
CREATE INDEX "ProofUpload_buyerRequestId_idx" ON "ProofUpload"("buyerRequestId");

-- CreateIndex
CREATE INDEX "ProofUpload_transactionId_idx" ON "ProofUpload"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_buyerRequestId_key" ON "Transaction"("buyerRequestId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerRequest" ADD CONSTRAINT "BuyerRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardholderOffer" ADD CONSTRAINT "CardholderOffer_cardholderId_fkey" FOREIGN KEY ("cardholderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofUpload" ADD CONSTRAINT "ProofUpload_buyerRequestId_fkey" FOREIGN KEY ("buyerRequestId") REFERENCES "BuyerRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofUpload" ADD CONSTRAINT "ProofUpload_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProofUpload" ADD CONSTRAINT "ProofUpload_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerRequestId_fkey" FOREIGN KEY ("buyerRequestId") REFERENCES "BuyerRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

