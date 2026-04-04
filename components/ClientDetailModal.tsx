'use client';

import { useState, useEffect } from 'react';

interface ClientDetailProps {
  shopId: string;
  clientId: string;
  clientName: string;
  onClose: () => void;
}

export default function ClientDetailModal({ shopId, clientId, clientName, onClose }: ClientDetailProps) {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);

  // CRM Form fields
  const [formData, setFormData] = useState({
    clientNotes: '',
    preferences: '',
    allergies: '',
    marketingConsent: false,
    smsConsent: false
  });
  
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/shops/${shopId}/clients/${clientId}`).then(r => r.json()),
      fetch(`/api/shops/${shopId}/loyalty`).then(r => r.json()).catch(() => null),
    ]).then(([clientData, loyaltyRes]) => {
      setClient(clientData);
      setFormData({
        clientNotes: clientData.clientNotes || '',
        preferences: clientData.preferences || '',
        allergies: clientData.allergies || '',
        marketingConsent: clientData.marketingConsent || false,
        smsConsent: clientData.smsConsent || false,
      });
      if (loyaltyRes?.program) {
        // Fetch this client's loyalty account from the accounts list
        fetch(`/api/shops/${shopId}/loyalty/accounts`)
          .then(r => r.json())
          .then((accounts: any[]) => {
            if (Array.isArray(accounts)) {
              const acct = accounts.find((a: any) => a.userId === clientId);
              setLoyaltyData(acct || null);
            }
          })
          .catch(() => {});
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shopId, clientId]);

  const saveCrmData = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSavedNotes(true);
        setTimeout(() => setSavedNotes(false), 2000);
      }
    } catch {
      alert('Failed to save profile');
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-[10px] font-bold border border-green-500/30">COMPLETED</span>;
      case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-500/30">NO-SHOW</span>;
      case 'CANCELLED': return <span className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded text-[10px] font-bold border border-red-500/30">CANCELLED</span>;
      default: return <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-500/30">SCHEDULED</span>;
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 rounded-xl p-6 w-full max-w-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl font-bold text-brand-gold">{clientName}</h3>
            {client && (
              <div className="text-xs text-gray-400 mt-1 space-y-1">
                <p>{client.email?.startsWith('walkin-') ? 'Walk-in Client' : client.email}</p>
                {client.phone && <p>📱 {client.phone}</p>}
                {client.referralCode && <p className="text-brand-gold/60">🔗 Referral: {client.referralCode}</p>}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-center py-8">Loading...</p>
        ) : client ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-white/5">
                  <p className="text-xl font-bold text-white">{client._count?.clientAppointments || 0}</p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Visits</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-white/5">
                  <p className="text-xl font-bold text-green-400">
                    ${client.clientAppointments?.filter((a: any) => a.status === 'COMPLETED').reduce((sum: number, a: any) => sum + (a.totalAmount > 0 ? a.totalAmount : (a.service?.price || 0)), 0).toFixed(0) || '0'}
                  </p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Spent</p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded-lg text-center border border-white/5">
                  <p className="text-xl font-bold text-amber-400">
                    {client.clientAppointments?.filter((a: any) => a.status === 'NO_SHOW').length || 0}
                  </p>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">No-Shows</p>
                </div>
              </div>

              {/* Loyalty Points Card */}
              {loyaltyData && (
                <div className="bg-gradient-to-r from-brand-gold/10 to-amber-900/10 border border-brand-gold/20 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">Loyalty Points</p>
                        <p className="text-xl font-black text-brand-gold">{loyaltyData.pointsBalance}</p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-gray-500">
                      <p>Earned: <span className="text-green-400 font-semibold">{loyaltyData.totalEarned}</span></p>
                      <p>Redeemed: <span className="text-red-400 font-semibold">{loyaltyData.totalRedeemed}</span></p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-1 flex flex-col h-full max-h-[300px]">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><span>📅</span> History</h4>
                {client.clientAppointments?.length > 0 ? (
                  <div className="space-y-2 overflow-y-auto custom-scrollbar pr-1">
                    {client.clientAppointments.map((apt: any) => (
                      <div key={apt.id} className="bg-slate-800/50 p-3 rounded-lg border border-white/5 text-sm">
                        <div className="flex justify-between items-start mb-1">
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">{apt.service?.name || 'Walkin Service'}</p>
                            <p className="text-[10px] text-gray-500">
                              {new Date(apt.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              {apt.staff?.name && ` • ${apt.staff.name}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="font-bold text-green-400">${(apt.totalAmount > 0 ? apt.totalAmount : (apt.service?.price || 0)).toFixed(2)}</p>
                            {getStatusBadge(apt.status)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic text-center py-4 border border-dashed border-white/10 rounded">No history yet.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 bg-slate-800/30 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-4"><span>📝</span> Profile & CRM</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Color Formulas / Notes</label>
                    <textarea
                      name="clientNotes"
                      value={formData.clientNotes}
                      onChange={handleChange}
                      placeholder="General notes..."
                      className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-y"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1 uppercase tracking-wider">Preferences</label>
                    <input
                      type="text"
                      name="preferences"
                      value={formData.preferences}
                      onChange={handleChange}
                      placeholder="e.g. prefers silent appointments, cold water"
                      className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-red-400/80 mb-1 uppercase tracking-wider">Allergies / Warnings</label>
                    <input
                      type="text"
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="e.g. allergic to almond oil products"
                      className="w-full bg-black/40 border border-red-500/30 rounded-md p-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/10 mt-3">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="marketingConsent" 
                          checked={formData.marketingConsent} 
                          onChange={handleChange}
                          className="rounded border-white/10 bg-slate-900 text-brand-gold focus:ring-brand-gold"
                        />
                        <span className="text-sm text-gray-300">Accepts Email Marketing</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          name="smsConsent" 
                          checked={formData.smsConsent} 
                          onChange={handleChange}
                          className="rounded border-white/10 bg-slate-900 text-brand-gold focus:ring-brand-gold"
                        />
                        <span className="text-sm text-gray-300">Accepts SMS Reminders/Promos</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-white/10 mt-4">
                <p className="text-[10px] text-gray-600">
                  Member since {new Date(client.createdAt).toLocaleDateString()}
                </p>
                <button 
                  onClick={saveCrmData} 
                  disabled={savingNotes} 
                  className="bg-brand-gold text-slate-900 px-5 py-2 rounded-md text-sm font-bold hover:bg-yellow-400 disabled:opacity-50 transition-colors"
                >
                  {savingNotes ? 'Saving...' : savedNotes ? '✓ Saved' : 'Save Profile'}
                </button>
              </div>
            </div>

          </div>
        ) : (
          <p className="text-red-400 text-center py-8">Failed to load client details.</p>
        )}
      </div>
    </div>
  );
}
