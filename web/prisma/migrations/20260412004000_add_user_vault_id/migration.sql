ALTER TABLE "User"
ADD COLUMN "vaultId" TEXT;

CREATE UNIQUE INDEX "User_vaultId_key" ON "User"("vaultId");
