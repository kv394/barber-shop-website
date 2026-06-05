import Image from 'next/image';
import React from 'react';

interface ExistingClient {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
}

export default function BookingWalkInForm({
  userRole,
  isWalkIn,
  setIsWalkIn,
  selectedExistingClient,
  setSelectedExistingClient,
  clientName,
  setClientName,
  clientEmail,
  setClientEmail,
  clientPhone,
  setClientPhone,
  clientSearchQuery,
  setClientSearchQuery,
  isSearchingClients,
  clientSearchResults,
  handleSelectExistingClient,
  handleClearSelectedClient,
  tStyles,
}: {
  userRole: string | null;
  isWalkIn: boolean;
  setIsWalkIn: (val: boolean) => void;
  selectedExistingClient: ExistingClient | null;
  setSelectedExistingClient: (val: ExistingClient | null) => void;
  clientName: string;
  setClientName: (val: string) => void;
  clientEmail: string;
  setClientEmail: (val: string) => void;
  clientPhone: string;
  setClientPhone: (val: string) => void;
  clientSearchQuery: string;
  setClientSearchQuery: (val: string) => void;
  isSearchingClients: boolean;
  clientSearchResults: ExistingClient[];
  handleSelectExistingClient: (c: ExistingClient) => void;
  handleClearSelectedClient: () => void;
  tStyles: any;
}) {
  return (
    <>
      {userRole && (
        <div className="mb-5 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-[13px]">
            <input type="checkbox" checked={isWalkIn} onChange={(e) => { setIsWalkIn(e.target.checked); setSelectedExistingClient(null); setClientName(''); setClientEmail(''); setClientPhone(''); }} className="w-4 h-4 accent-crm-primary" />
            <span className="text-crm-text font-semibold">Walk-in Booking</span>
          </label>
        </div>
      )}

      {isWalkIn && (
        <div className="mb-5 space-y-3 bg-crm-bg rounded-lg border border-crm-border p-4">
          <p className="text-crm-text text-[12px] font-semibold mb-2">Client Details</p>
          {selectedExistingClient ? (
            <div className="flex items-center justify-between bg-crm-surface p-3 rounded border border-crm-border">
              <div>
                <p className="text-crm-text font-semibold text-[13px]">{selectedExistingClient.name}</p>
                <p className="text-crm-muted text-[12px]">{selectedExistingClient.email}</p>
              </div>
              <button onClick={handleClearSelectedClient} className="text-crm-muted hover:text-crm-text text-[12px]">✕ Clear</button>
            </div>
          ) : (
            <>
              <div className="relative">
                <input type="text" placeholder="Search existing client..." value={clientSearchQuery} onChange={(e) => setClientSearchQuery(e.target.value)} className={`${tStyles.input} text-[13px]`} />
                {isSearchingClients && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-crm-muted text-[11px]">Searching...</span>}
                {clientSearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-crm-surface border border-crm-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                    {clientSearchResults.map(c => (
                      <button key={c.id} onClick={() => handleSelectExistingClient(c)} className="w-full text-left px-3 py-2 hover:bg-crm-bg text-[13px] text-crm-text border-b border-crm-border last:border-0">
                        {c.name || c.email} <span className="text-crm-muted text-[11px]">({c.email})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input type="text" placeholder="Client Name *" value={clientName} onChange={(e) => setClientName(e.target.value)} className={`${tStyles.input} text-[13px]`} />
              <input type="email" placeholder="Client Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={`${tStyles.input} text-[13px]`} />
              <input type="tel" placeholder="Client Phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className={`${tStyles.input} text-[13px]`} />
            </>
          )}
        </div>
      )}
    </>
  );
}
