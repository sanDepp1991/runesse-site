/*
  Warnings:

  - The values [PENDING,APPROVED] on the enum `NewRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NewRequestStatus_new" AS ENUM ('SUBMITTED', 'ADMIN_APPROVED', 'MATCHED', 'COMPLETED', 'REJECTED', 'CANCELLED');
ALTER TABLE "Request" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Request" ALTER COLUMN "status" TYPE "NewRequestStatus_new" USING ("status"::text::"NewRequestStatus_new");
ALTER TYPE "NewRequestStatus" RENAME TO "NewRequestStatus_old";
ALTER TYPE "NewRequestStatus_new" RENAME TO "NewRequestStatus";
DROP TYPE "NewRequestStatus_old";
ALTER TABLE "Request" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterTable
ALTER TABLE "Request" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED',
ALTER COLUMN "matchedCardholderEmail" SET DATA TYPE TEXT;
