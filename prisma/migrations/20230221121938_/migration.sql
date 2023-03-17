-- DropForeignKey
ALTER TABLE "SubscriptionExecution" DROP CONSTRAINT "SubscriptionExecution_subId_fkey";

-- AlterTable
ALTER TABLE "SubscriptionExecution" ALTER COLUMN "subId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SubscriptionExecution" ADD CONSTRAINT "SubscriptionExecution_subId_fkey" FOREIGN KEY ("subId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
