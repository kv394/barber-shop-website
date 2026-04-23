'use client';

import { useState } from 'react';
import UserQRCode from '@/components/clients/UserQRCode';
import ClientDetailModal from '@/components/clients/ClientDetailModal';

export default function ClientGrid({ clients, shopId }: { clients: any[]; shopId: string }) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client => {
    const term = searchTerm.toLowerCase();
    return (
      (client.name?.toLowerCase() || '').includes(term) ||
      (client.email?.toLowerCase() || '').includes(term) ||
      (client.barcode?.toLowerCase() || '').includes(term) ||
      (client.phone?.toLowerCase() || '').includes(term)
    );
  });

  return (
    <>
      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-crm-muted">🔍</span>
          <input 
            type="text" 
            placeholder="Search by name, email, phone, or barcode ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-xl pl-12 pr-4 py-3 text-crm-text focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-crm-primary shadow-lg"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <p className="text-crm-muted italic text-center py-8 bg-crm-surface rounded-xl border border-dashed border-crm-border text-[13px]">No clients match your search.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredClients.map((client: any) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="bg-crm-surface p-3 sm:p-5 rounded-lg border border-crm-border shadow-sm flex flex-col cursor-pointer hover:border-brand-gold/30 transition-colors group"
            >
              <div className="flex justify-between items-start mb-3 sm:mb-4 gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-crm-accent truncate group-hover:text-crm-text transition-colors text-base font-semibold">{client.name || "Guest User"}</h4>
                  <p className="text-crm-muted truncate text-[13px]">{client.email.startsWith('walkin-') ? 'Walk-in (No Email)' : client.email}</p>
                </div>
                <div className="shrink-0">
                  <UserQRCode barcode={client.barcode || client.id} userName={client.name || "Client"} showText={false} size={64} />
                </div>
              </div>
              
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-end mt-auto pt-4 border-t border-crm-border">
                <div className="text-[11px] text-crm-muted">
                  <div>Total Visits: <span className="font-bold text-crm-text ml-1">{client._count?.clientAppointments || 0}</span></div>
                  {client.lastVisit && (
                    <div className="mt-1">Last: <span className="text-crm-muted">{new Date(client.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>
                  )}
                </div>
              </div>
              
              <div className="mt-2 text-[13px] text-crm-muted font-mono tracking-widest break-all">
                ID: {client.barcode || client.id}
              </div>

              <p className="mt-2 text-crm-muted group-hover:text-crm-accent transition-colors text-[13px]">Click to view details →</p>
            </div>
          ))}
        </div>
      )}

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

