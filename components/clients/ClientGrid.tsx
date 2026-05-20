'use client';

import { useState, useEffect } from 'react';
import UserQRCode from '@/components/clients/UserQRCode';
import ClientDetailModal from '@/components/clients/ClientDetailModal';

export default function ClientGrid({ clients, shopId, initialSelectedClientId }: { clients: any[]; shopId: string; initialSelectedClientId?: string }) {
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
        <div className="bg-crm-surface border border-crm-border rounded-xl shadow-sm overflow-hidden">
          {/* Mobile View (Cards) */}
          <div className="md:hidden divide-y divide-crm-border">
            {filteredClients.map((client: any) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="p-4 flex flex-col gap-3 hover:bg-crm-bg/50 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-crm-text text-[15px] truncate">{client.name || "Guest User"}</h4>
                    <p className="text-crm-muted text-[13px] truncate mt-0.5">{client.email.startsWith('walkin-') ? 'Walk-in (No Email)' : client.email}</p>
                    {client.phone && <p className="text-crm-muted text-[13px] truncate mt-0.5">{client.phone}</p>}
                  </div>
                  <div className="shrink-0">
                    <UserQRCode barcode={client.barcode || client.id} userName={client.name || "Client"} showText={false} size={48} />
                  </div>
                </div>
                <div className="flex justify-between items-center text-[12px] text-crm-muted">
                  <div className="font-mono truncate max-w-[150px]">ID: {client.barcode || client.id}</div>
                  <div>Visits: <span className="font-bold text-crm-text">{client._count?.clientAppointments || 0}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-crm-bg border-b border-crm-border text-[11px] font-bold text-crm-muted uppercase tracking-wider">
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Contact Info</th>
                  <th className="px-6 py-4">Barcode ID</th>
                  <th className="px-6 py-4 text-center">Visits</th>
                  <th className="px-6 py-4">Last Visit</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-crm-border">
                {filteredClients.map((client: any) => (
                  <tr 
                    key={client.id} 
                    onClick={() => setSelectedClient(client)}
                    className="group cursor-pointer hover:bg-crm-bg/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="shrink-0 rounded-lg overflow-hidden border border-crm-border bg-white p-1">
                          <UserQRCode barcode={client.barcode || client.id} userName={client.name || "Client"} showText={false} size={40} />
                        </div>
                        <div>
                          <div className="font-bold text-crm-text text-[15px] group-hover:text-crm-primary transition-colors">{client.name || "Guest User"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[13px] text-crm-muted">{client.email.startsWith('walkin-') ? 'Walk-in (No Email)' : client.email}</div>
                      {client.phone && <div className="text-[13px] text-crm-muted mt-0.5">{client.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-[12px] text-crm-muted tracking-wide break-all max-w-[150px]">{client.barcode || client.id}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-md bg-crm-bg border border-crm-border text-crm-text font-bold text-[13px]">
                        {client._count?.clientAppointments || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-crm-muted">
                      {client.lastVisit ? new Date(client.lastVisit).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[13px] font-bold text-crm-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

