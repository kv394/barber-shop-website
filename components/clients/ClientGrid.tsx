'use client';

import { useState } from 'react';
import UserQRCode from '@/components/clients/UserQRCode';
import ClientDetailModal from '@/components/clients/ClientDetailModal';

export default function ClientGrid({ clients, shopId }: { clients: any[]; shopId: string }) {
  const [selectedClient, setSelectedClient] = useState<any>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {clients.map((client: any) => (
          <div
            key={client.id}
            onClick={() => setSelectedClient(client)}
            className="bg-slate-900/70 p-3 sm:p-5 rounded-lg border border-white/10 flex flex-col cursor-pointer hover:border-brand-gold/30 transition-colors group"
          >
            <div className="mb-3 sm:mb-4">
              <h4 className="font-bold text-base sm:text-lg text-brand-gold truncate group-hover:text-white transition-colors">{client.name || "Guest User"}</h4>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{client.email.startsWith('walkin-') ? 'Walk-in (No Email)' : client.email}</p>
            </div>
            
            <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/10">
              <div className="text-xs text-gray-500">
                <div>Total Visits: <span className="font-bold text-white ml-1">{client._count?.clientAppointments || 0}</span></div>
                {client.lastVisit && (
                  <div className="mt-1">Last: <span className="text-gray-300">{new Date(client.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                )}
              </div>
              
              {client.barcode && (
                <div className="transform scale-[0.6] origin-bottom-right translate-y-4 translate-x-4">
                  <UserQRCode barcode={client.barcode} userName={client.name || "Client"} showText={false} />
                </div>
              )}
            </div>
            
            {client.barcode && (
              <div className="mt-2 text-[10px] text-gray-600 font-mono tracking-widest break-all">
                ID: {client.barcode}
              </div>
            )}

            <p className="mt-2 text-[10px] text-gray-500 group-hover:text-brand-gold transition-colors">Click to view details →</p>
          </div>
        ))}
      </div>

      {selectedClient && (
        <ClientDetailModal
          shopId={shopId}
          clientId={selectedClient.id}
          clientName={selectedClient.name || 'Guest User'}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </>
  );
}

