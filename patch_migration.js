const fs = require('fs');
const path = './prisma/migrations/20260602000000_optimize_indexes/migration.sql';
let sql = fs.readFileSync(path, 'utf8');

// Replace CREATE INDEX with CREATE INDEX IF NOT EXISTS
sql = sql.replace(/CREATE INDEX "/g, 'CREATE INDEX IF NOT EXISTS "');

const createTableSql = `
-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "PricingRuleType" AS ENUM ('TIME_BASED', 'DEMAND_BASED', 'LAST_MINUTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PricingAdjustmentType" AS ENUM ('PERCENTAGE', 'FIXED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "DynamicPricingRule" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PricingRuleType" NOT NULL,
    "adjustmentType" "PricingAdjustmentType" NOT NULL,
    "adjustmentValue" DOUBLE PRECISION NOT NULL,
    "daysOfWeek" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DynamicPricingRule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'DynamicPricingRule_shopId_fkey') THEN
        ALTER TABLE "DynamicPricingRule" ADD CONSTRAINT "DynamicPricingRule_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

`;

fs.writeFileSync(path, createTableSql + sql);
