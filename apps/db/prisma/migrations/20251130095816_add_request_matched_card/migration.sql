-- DropIndex
DROP INDEX "Request_buyerEmail_status_idx";

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "matchedCardId" TEXT;

-- CreateIndex
CREATE INDEX "Request_status_buyerEmail_idx" ON "Request"("status", "buyerEmail");

-- CreateIndex
CREATE INDEX "Request_matchedCardId_idx" ON "Request"("matchedCardId");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_matchedCardId_fkey" FOREIGN KEY ("matchedCardId") REFERENCES "SavedCard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
