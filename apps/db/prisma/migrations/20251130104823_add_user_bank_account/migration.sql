-- CreateEnum
CREATE TYPE "BankAccountStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- CreateTable
CREATE TABLE "UserBankAccount" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userEmail" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "bankName" TEXT,
    "branchName" TEXT,
    "status" "BankAccountStatus" NOT NULL DEFAULT 'PENDING',
    "verificationMethod" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),

    CONSTRAINT "UserBankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBankAccount_userEmail_role_idx" ON "UserBankAccount"("userEmail", "role");
