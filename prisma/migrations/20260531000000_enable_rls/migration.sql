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

-- Create tenant isolation policies (idempotent: drops existing policy first)
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
        -- Drop existing policy if it exists (makes this migration idempotent)
        EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation_policy" ON %I;', tbl);
        -- Create the policy
        EXECUTE format('
            CREATE POLICY "tenant_isolation_policy" ON %I
            FOR ALL
            USING (
                "shopId" = current_setting(''app.current_shop_id'', true)
                OR current_setting(''app.bypass_rls'', true) = ''true''
            );
        ', tbl);
    END LOOP;
END $$;
