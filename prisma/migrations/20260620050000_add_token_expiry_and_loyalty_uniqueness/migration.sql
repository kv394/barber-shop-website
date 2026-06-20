-- M5: Add management token expiry to Appointment
ALTER TABLE "Appointment" ADD COLUMN "managementTokenExpiresAt" TIMESTAMP(3);

-- M7: Add unique constraint to prevent duplicate loyalty awards per appointment
CREATE UNIQUE INDEX "unique_loyalty_award" ON "LoyaltyTransaction"("loyaltyAccountId", "appointmentId", "type");
