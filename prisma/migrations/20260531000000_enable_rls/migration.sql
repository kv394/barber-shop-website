-- Enable Row-Level Security on core tenant tables
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceAddon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopClient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CommissionRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GiftCard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BoothRentPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PurchaseOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Leave" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Waitlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopBlackoutDate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Resource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RenterService" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyProgram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Referral" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MembershipTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FormTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientFormula" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClientHistoryImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PortfolioImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopAccess" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopUsageReport" ENABLE ROW LEVEL SECURITY;

-- Create policy definition
-- This policy ensures that the row's shopId exactly matches the app.current_shop_id 
-- injected by Prisma's SET LOCAL, OR allows full access if bypass is enabled (e.g. for SITE_ADMIN).
-- The current_setting('app.current_shop_id', true) returns NULL if not set, preventing accidental access.

DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'shopId' 
          AND table_schema = 'public' 
          AND table_name NOT IN ('User', 'Shop', 'DynamicTemplate', 'SystemLog')
    LOOP
        EXECUTE format('
            CREATE POLICY "tenant_isolation_policy" ON "%I"
            FOR ALL
            USING (
                "shopId" = current_setting(''app.current_shop_id'', true)
                OR current_setting(''app.bypass_rls'', true) = ''true''
            );
        ', tbl);
    END LOOP;
END $$;
