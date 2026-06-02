
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "BoothRentPayment_status_idx" ON "BoothRentPayment"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "DynamicPricingRule_isActive_idx" ON "DynamicPricingRule"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GiftCard_status_idx" ON "GiftCard"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GiftCard_purchaserEmail_idx" ON "GiftCard"("purchaserEmail");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "GiftCard_recipientEmail_idx" ON "GiftCard"("recipientEmail");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LoyaltyProgram_isActive_idx" ON "LoyaltyProgram"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_isSellable_idx" ON "Product"("isSellable");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RenterService_isActive_idx" ON "RenterService"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Service_isBookable_idx" ON "Service"("isBookable");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Shop_isActive_idx" ON "Shop"("isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ShopClient_phone_idx" ON "ShopClient"("phone");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ShopClient_stripeCustomerId_idx" ON "ShopClient"("stripeCustomerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SystemLog_isResolved_idx" ON "SystemLog"("isResolved");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "UserMembership_status_idx" ON "UserMembership"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Waitlist_status_idx" ON "Waitlist"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Waitlist_clientPhone_idx" ON "Waitlist"("clientPhone");

