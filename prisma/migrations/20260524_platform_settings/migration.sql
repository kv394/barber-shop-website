-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "platformName" TEXT NOT NULL DEFAULT 'KutzApp',
    "supportEmail" TEXT,
    "platformFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enableSms" BOOLEAN NOT NULL DEFAULT false,
    "enableAi" BOOLEAN NOT NULL DEFAULT true,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#f59e0b',
    "analyticsId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- Seed Initial Row
INSERT INTO "PlatformSettings" ("id", "platformName", "platformFeePercent", "enableSms", "enableAi", "updatedAt") 
VALUES ('global', 'KutzApp', 0, false, true, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
