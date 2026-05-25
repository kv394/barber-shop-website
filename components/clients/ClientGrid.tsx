'use client';

import { useState, useEffect } from 'react';
import UserQRCode from '@/components/clients/UserQRCode';
import ClientDetailModal from '@/components/clients/ClientDetailModal';

import PremiumGlassCard from '@/components/ui/PremiumGlassCard';

export default function ClientGrid({ clients, shopId, initialSelectedClientId, currency = 'USD' }: { clients: any[]; shopId: string; initialSelectedClientId?: string; currency?: string }) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (initialSelectedClientId) {
      // Find the client in the list if available, or just create a dummy object to open the modal
      const existingClient = clients.find(c => c.id === initialSelectedClientId);
      if (existingClient) {
        setSelectedClient(existingClient);
      } else {
        setSelectedClient({ id: initialSelectedClientId, name: 'Loading...' });
      }
    }
  }, [initialSelectedClientId, clients]);

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
      <div className="mb-6 relative group">
        <div className="absolute inset-0 bg-crm-primary/10 blur-[30px] rounded-full group-hover:bg-crm-primary/20 transition-all duration-500"></div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-crm-muted/70 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="Search by name, email, phone, or barcode ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-crm-bg/50 backdrop-blur-md border border-white/10 shadow-inner rounded-2xl pl-12 pr-4 py-4 text-crm-text focus:outline-none focus:ring-2 focus:ring-crm-primary transition-all placeholder:text-crm-muted/50 text-[15px] font-medium"
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white/5 backdrop-blur-sm rounded-2xl border border-dashed border-white/20">
          <span className="text-4xl mb-4 opacity-50 drop-shadow-md">📇</span>
          <h2 className="text-xl font-bold text-crm-text mb-2">No clients found</h2>
          <p className="text-crm-muted text-[14px] max-w-[250px] mx-auto font-medium">
            We couldn't find any clients matching your search.
          </p>
        </div>
      ) : (
        <PremiumGlassCard className="!p-0 overflow-hidden" accentColor="crm-primary">
          {/* Mobile View (Cards) */}
          <div className="md:hidden divide-y divide-white/10">
            {filteredClients.map((client: any) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="p-5 flex flex-col gap-3 hover:bg-white/30 transition-colors cursor-pointer relative group"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <h4 className="font-bold text-crm-text text-[16px] truncate group-hover:text-crm-primary transition-colors">{client.name || "Guest User"}</h4>
                    <p className="text-crm-muted text-[13px] truncate mt-1">{client.email.startsWith('walkin-') ? 'Walk-in (No Email)' : client.email}</p>
                    {client.phone && <p className="text-crm-muted text-[13px] truncate mt-0.5 font-medium">{client.phone}</p>}
                  </div>
                  <div className="shrink-0 bg-white/50 p-1.5 rounded-xl border border-white/10 shadow-inner">
                    <UserQRCode barcode={client.barcode || client.id} userName={client.name || "Client"} showText={false} size={48} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[12px] text-crm-muted bg-white/20 -mx-5 px-5 -mb-5 pb-5 pt-3 border-t border-white/5 mt-2">
                  <div className="font-mono truncate max-w-[150px] font-bold">ID: {client.barcode || client.id}</div>
                  <div className="flex items-center gap-2">
                    <span className="uppercase tracking-widest font-black text-[10px]">Visits</span>
                    <span className="font-black text-crm-text bg-white/50 px-2 py-0.5 rounded shadow-inner">{client._count?.clientAppointments || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-crm-bg/60 border-b border-white/10 text-[11px] font-black text-crm-muted uppercase tracking-widest">
                  <th className="px-6 py-5">Client</th>
                  <th className="px-6 py-5">Contact Info</th>
                  <th className="px-6 py-5">Barcode ID</th>
                  <th className="px-6 py-5 text-center">Visits</th>
                  <th className="px-6 py-5">Last Visit</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredClients.map((client: any) => (
                  <tr 
                    key={client.id} 
                    onClick={() => setSelectedClient(client)}
                    className="group cursor-pointer hover:bg-white/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="shrink-0 rounded-xl overflow-hidden border border-white/20 bg-white/50 p-1.5 shadow-inner group-hover:border-crm-primary/50 transition-colors">
                          <UserQRCode barcode={client.barcode || client.id} userName={client.name || "Client"} showText={false} size={44} />
                        </div>
                        <div>
                          <div className="font-black text-crm-text text-[15px] group-hover:text-crm-primary transition-colors">{client.name || "Guest User"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] text-crm-muted font-medium">{client.email.startsWith('walkin-') ? 'Walk-in (No Email)' : client.email}</div>
                      {client.phone && <div className="text-[13px] text-crm-muted mt-1 font-medium">{client.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[12px] font-bold text-crm-muted tracking-wide bg-crm-bg/50 px-2 py-1 rounded shadow-inner inline-block">{client.barcode || client.id}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg bg-white/50 border border-white/10 text-crm-text font-black text-[14px] shadow-inner">
                        {client._count?.clientAppointments || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-crm-muted font-medium">
                      {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : <span className="italic opacity-50">Never</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[11px] font-black text-crm-primary opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider bg-crm-primary/10 hover:bg-crm-primary/20 px-3 py-1.5 rounded-full border border-crm-primary/20">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PremiumGlassCard>
      )}

      {selectedClient && (
        <ClientDetailModal
          shopId={shopId}
          clientId={selectedClient.id}
          clientName={selectedClient.name || 'Guest User'}
          onClose={() => setSelectedClient(null)}
          currency={currency}
        />
      )}
    </>
  );
}

