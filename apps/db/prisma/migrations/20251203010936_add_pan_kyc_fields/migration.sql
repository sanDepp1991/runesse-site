-- CreateEnum
CREATE TYPE "PanStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "panMasked" TEXT,
ADD COLUMN     "panName" TEXT,
ADD COLUMN     "panStatus" "PanStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "panVerifiedAt" TIMESTAMP(3);
