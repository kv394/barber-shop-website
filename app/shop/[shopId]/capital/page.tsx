import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import CapitalOfferCard from '@/components/shop-admin/CapitalOfferCard';

export const dynamic = 'force-dynamic';

export default async function CapitalPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect('/');

  const data = await getShopLayoutData(user.id, shopId);
  if (!data) return redirect('/');

  const { userRole, shop, shopSlug } = data;
  const isAdmin = userRole === 'SHOP_ADMIN' || userRole === 'SITE_ADMIN';

  if (!isAdmin) return redirect(`/shop/${shopId}`);

  const resolvedSlug = shopSlug || shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  // Generate a mock eligible amount based on shopId length or some arbitrary logic
  const mockEligibleAmount = Math.max(5000, shopId.length * 1500 + 2000);
  const mockFeeAmount = Math.round(mockEligibleAmount * 0.12); // 12% max fee
  
  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={resolvedSlug}
      pageTitle="KutzApp Capital"
      shopId={shopId}
      userRole={userRole}
    >
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 -mt-4 mb-2">
          <p className="text-crm-muted text-[13px]">Access fast, flexible funding to grow your business.</p>
        </div>

        <CapitalOfferCard 
          eligibleAmount={mockEligibleAmount} 
          repaymentRate={10} 
          feeAmount={mockFeeAmount} 
        />

        <div className="mt-12 bg-white rounded-2xl p-8 border border-crm-border shadow-sm">
          <h2 className="text-lg font-bold text-crm-text mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ea580c]"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 bg-[#FFF5F2] rounded-lg text-[#ea580c] mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-crm-text text-sm">What is Revenue-Based Financing?</h3>
                  <p className="text-[13px] text-crm-muted mt-1 leading-relaxed">
                    Unlike a traditional loan with fixed monthly payments, revenue-based financing allows you to repay using a fixed percentage of your daily card sales. When business is slow, you pay less.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 bg-[#FFF5F2] rounded-lg text-[#ea580c] mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-crm-text text-sm">Are there hidden fees or interest?</h3>
                  <p className="text-[13px] text-crm-muted mt-1 leading-relaxed">
                    No. You pay one flat transparent fee. There's no compounding interest, no late fees, and no penalty for taking longer to repay if sales are slow.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 bg-[#FFF5F2] rounded-lg text-[#ea580c] mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-crm-text text-sm">How quickly do I get the funds?</h3>
                  <p className="text-[13px] text-crm-muted mt-1 leading-relaxed">
                    Once approved and you accept the offer, funds are typically transferred to your linked bank account within 1-2 business days.
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-start gap-3 mb-2">
                <div className="p-2 bg-[#FFF5F2] rounded-lg text-[#ea580c] mt-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-crm-text text-sm">How is my limit determined?</h3>
                  <p className="text-[13px] text-crm-muted mt-1 leading-relaxed">
                    Your eligible amount is based on your shop's recent transaction volume on KutzApp. As your business grows, your funding limit may increase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ShopAdminLayout>
  );
}
