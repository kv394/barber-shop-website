-- AlterTable
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "premiumFeatures" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "requiresVirtualConsultation" BOOLEAN NOT NULL DEFAULT false;
