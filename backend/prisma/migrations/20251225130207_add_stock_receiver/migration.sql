-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockIssue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "requestId" INTEGER NOT NULL,
    "issuedBy" INTEGER NOT NULL,
    "receivedBy" INTEGER,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "issuedAt" DATETIME,
    "receivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StockIssue_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MaterialRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockIssue_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockIssue_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockIssue" ("code", "createdAt", "id", "issuedAt", "issuedBy", "note", "requestId", "status", "updatedAt") SELECT "code", "createdAt", "id", "issuedAt", "issuedBy", "note", "requestId", "status", "updatedAt" FROM "StockIssue";
DROP TABLE "StockIssue";
ALTER TABLE "new_StockIssue" RENAME TO "StockIssue";
CREATE UNIQUE INDEX "StockIssue_code_key" ON "StockIssue"("code");
CREATE UNIQUE INDEX "StockIssue_requestId_key" ON "StockIssue"("requestId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
