-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "acceptanceNote" TEXT;
ALTER TABLE "Payment" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "Payment" ADD COLUMN "approvedBy" INTEGER;
ALTER TABLE "Payment" ADD COLUMN "deliveryNote" TEXT;
ALTER TABLE "Payment" ADD COLUMN "uncFile" TEXT;
ALTER TABLE "Payment" ADD COLUMN "uncNumber" TEXT;
ALTER TABLE "Payment" ADD COLUMN "vatInvoiceFile" TEXT;
