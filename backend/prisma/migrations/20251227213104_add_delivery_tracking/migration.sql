-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN "actualDelivery" DATETIME;
ALTER TABLE "PurchaseOrder" ADD COLUMN "estimatedDelivery" DATETIME;

-- CreateTable
CREATE TABLE "DeliveryTracking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "poId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "location" TEXT,
    "note" TEXT,
    "isDelayed" BOOLEAN NOT NULL DEFAULT false,
    "delayReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeliveryTracking_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
