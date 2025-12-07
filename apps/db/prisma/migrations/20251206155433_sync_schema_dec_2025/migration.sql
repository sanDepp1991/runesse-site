-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "requestedCardLabel" TEXT,
ADD COLUMN     "requestedIssuer" TEXT,
ADD COLUMN     "requestedNetwork" TEXT;
