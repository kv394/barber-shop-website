-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "BoothRentPayment_status_idx" ON "BoothRentPayment"("status");

-- CreateIndex
CREATE INDEX "DynamicPricingRule_isActive_idx" ON "DynamicPricingRule"("isActive");

-- CreateIndex
CREATE INDEX "GiftCard_status_idx" ON "GiftCard"("status");

-- CreateIndex
CREATE INDEX "GiftCard_purchaserEmail_idx" ON "GiftCard"("purchaserEmail");

-- CreateIndex
CREATE INDEX "GiftCard_recipientEmail_idx" ON "GiftCard"("recipientEmail");

-- CreateIndex
CREATE INDEX "LoyaltyProgram_isActive_idx" ON "LoyaltyProgram"("isActive");

-- CreateIndex
CREATE INDEX "Notification_status_idx" ON "Notification"("status");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Product_isSellable_idx" ON "Product"("isSellable");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "RenterService_isActive_idx" ON "RenterService"("isActive");

-- CreateIndex
CREATE INDEX "Service_isBookable_idx" ON "Service"("isBookable");

-- CreateIndex
CREATE INDEX "Shop_isActive_idx" ON "Shop"("isActive");

-- CreateIndex
CREATE INDEX "ShopClient_phone_idx" ON "ShopClient"("phone");

-- CreateIndex
CREATE INDEX "ShopClient_stripeCustomerId_idx" ON "ShopClient"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "SystemLog_isResolved_idx" ON "SystemLog"("isResolved");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "UserMembership_status_idx" ON "UserMembership"("status");

-- CreateIndex
CREATE INDEX "Waitlist_status_idx" ON "Waitlist"("status");

-- CreateIndex
CREATE INDEX "Waitlist_clientPhone_idx" ON "Waitlist"("clientPhone");

