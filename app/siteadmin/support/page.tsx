import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import BroadcastForm from './BroadcastForm';

export const dynamic = 'force-dynamic';

export default async function SupportAndBroadcastPage() {
  // Fetch previous broadcasts
  const broadcasts = await prisma.systemLog.findMany({
    where: { level: 'BROADCAST' },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif font-bold text-crm-accent mb-2 text-2xl">Support & Broadcasts</h1>
        <p className="text-crm-muted text-[13px]">Manage platform-wide announcements and monitor support requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <BroadcastForm />
        </div>

        <div className="space-y-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm shadow-brand-indigo/5 p-6 h-full flex flex-col">
            <h2 className="font-bold text-crm-text text-xl mb-4">📜 Recent Broadcasts</h2>
            
            {broadcasts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-crm-surface/50 border border-crm-border border-dashed rounded-lg">
                <span className="text-3xl mb-2">📭</span>
                <p className="text-crm-text font-medium text-[14px]">No broadcasts yet</p>
                <p className="text-crm-muted text-[12px] mt-1">Sent announcements will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {broadcasts.map((log: any) => {
                  const meta = log.metadata as any;
                  return (
                    <div key={log.id} className="p-4 bg-crm-surface border border-crm-border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-crm-text text-[14px]">{log.message}</h3>
                        <span className="text-[11px] text-crm-muted bg-white px-2 py-1 rounded-md border border-crm-border">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[13px] text-crm-muted line-clamp-2 mb-3">
                        {meta?.content || 'No content'}
                      </p>
                      <div className="flex items-center">
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#ea580c] bg-[#FFF5F2] px-2 py-0.5 rounded">
                          Target: {meta?.target || 'All'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
