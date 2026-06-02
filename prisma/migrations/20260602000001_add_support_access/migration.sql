-- AlterTable
ALTER TABLE "Shop" ADD COLUMN "supportAccessEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Shop" ADD COLUMN "supportAccessExpiresAt" TIMESTAMP(3);
