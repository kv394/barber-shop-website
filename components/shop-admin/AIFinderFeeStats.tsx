import { prisma } from '@/lib/prisma';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';

export default async function AIFinderFeeStats({ shopId }: { shopId: string }) {
  // If 'all' shops (for site admins), maybe we handle differently or just return null
  // But let's assume it gets passed a single shopId, or we use in: shopIds
  // The instructions specify "for this shop" so we assume shopId is a valid ID or 'all'
  
  let count = 0;
  
  if (shopId === 'all') {
    count = await prisma.appointment.count({
      where: {
        aiGenerated: true
      }
    });
  } else {
    count = await prisma.appointment.count({
      where: {
        shopId: shopId,
        aiGenerated: true
      }
    });
  }

  const totalFees = (count * 2.00).toFixed(2);

  return (
    <PremiumGlassCard className="flex flex-col gap-4 overflow-hidden relative" accentColor="crm-primary">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-crm-text flex items-center gap-2">
          <span className="text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </span>
          AI Finder's Fees
        </h3>
        <p className="text-[12px] text-crm-muted font-medium mt-1 pr-12">
          KutzApp only charges a flat $2.00 fee for bookings generated exclusively by the AI chatbot.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[11px] font-black text-cyan-400 uppercase tracking-widest mb-1 relative z-10">AI-Generated Bookings</p>
          <p className="text-3xl font-black text-crm-text drop-shadow-md relative z-10">{count}</p>
        </div>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[11px] font-black text-purple-400 uppercase tracking-widest mb-1 relative z-10">Total Finder's Fees</p>
          <p className="text-3xl font-black text-crm-text drop-shadow-md relative z-10">${totalFees}</p>
        </div>
      </div>
    </PremiumGlassCard>
  );
}
