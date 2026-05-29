
-- CreateEnum
CREATE TYPE "ShopType" AS ENUM ('PHYSICAL', 'MOBILE', 'HYBRID');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "serviceLocation" TEXT;

-- AlterTable
ALTER TABLE "PlatformSettings" ADD COLUMN     "allowNewRegistrations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "defaultTimezone" TEXT NOT NULL DEFAULT 'America/New_York',
ADD COLUMN     "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "openAiKey" TEXT,
ADD COLUMN     "resendApiKey" TEXT,
ADD COLUMN     "stripeSecretKey" TEXT,
ADD COLUMN     "stripeWebhookSecret" TEXT,
ADD COLUMN     "twilioAccountSid" TEXT,
ADD COLUMN     "twilioAuthToken" TEXT,
ADD COLUMN     "twilioFromNumber" TEXT;

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "baseLocation" TEXT,
ADD COLUMN     "inventoryForecast" JSONB,
ADD COLUMN     "inventoryForecastUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "maxTravelRadius" INTEGER,
ADD COLUMN     "razorpayKeyId" TEXT,
ADD COLUMN     "razorpayKeySecret" TEXT,
ADD COLUMN     "shopType" "ShopType" NOT NULL DEFAULT 'PHYSICAL',
ADD COLUMN     "travelFee" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "allergies",
DROP COLUMN "birthday",
DROP COLUMN "clientNotes",
DROP COLUMN "phone",
DROP COLUMN "preferences",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "stripePaymentMethodId",
ADD COLUMN     "boothRentAmount" DOUBLE PRECISION,
ADD COLUMN     "boothRentInterval" "BoothRentInterval",
ADD COLUMN     "employmentType" "EmploymentType" DEFAULT 'W2';

-- AlterTable
ALTER TABLE "_ServiceToAddons" ADD CONSTRAINT "_ServiceToAddons_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ServiceToAddons_AB_unique";

-- CreateTable
CREATE TABLE "ShopClient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "clientNotes" TEXT,
    "allergies" TEXT,
    "preferences" TEXT,
    "phone" TEXT,
    "birthday" TIMESTAMP(3),
    "stripeCustomerId" TEXT,
    "stripePaymentMethodId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShopClient_shopId_idx" ON "ShopClient"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopClient_userId_shopId_key" ON "ShopClient"("userId", "shopId");

-- CreateIndex
CREATE INDEX "Appointment_staffId_idx" ON "Appointment"("staffId");

-- CreateIndex
CREATE INDEX "AppointmentItem_appointmentId_idx" ON "AppointmentItem"("appointmentId");

-- CreateIndex
CREATE INDEX "AppointmentItem_productId_idx" ON "AppointmentItem"("productId");

-- CreateIndex
CREATE INDEX "Payment_appointmentId_idx" ON "Payment"("appointmentId");

-- AddForeignKey
ALTER TABLE "ShopClient" ADD CONSTRAINT "ShopClient_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopClient" ADD CONSTRAINT "ShopClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

