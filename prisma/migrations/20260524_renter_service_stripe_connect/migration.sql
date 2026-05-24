-- Add Stripe Connect fields to User
ALTER TABLE "User" ADD COLUMN "stripeConnectAccountId" TEXT;
ALTER TABLE "User" ADD COLUMN "stripeConnectOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- Create RenterService table
CREATE TABLE "RenterService" (
    "id"          TEXT NOT NULL,
    "userId"      TEXT NOT NULL,
    "shopId"      TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "description" TEXT,
    "price"       DOUBLE PRECISION NOT NULL,
    "duration"    INTEGER NOT NULL,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenterService_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "RenterService_userId_idx" ON "RenterService"("userId");
CREATE INDEX "RenterService_shopId_idx" ON "RenterService"("shopId");

-- Foreign Keys
ALTER TABLE "RenterService" ADD CONSTRAINT "RenterService_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RenterService" ADD CONSTRAINT "RenterService_shopId_fkey"
    FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
