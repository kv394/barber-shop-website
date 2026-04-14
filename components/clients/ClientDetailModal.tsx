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

  const [activeTab, setActiveTab] = useState<'crm' | 'history' | 'formulas' | 'gallery'>('crm');
  
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

  // Formulas & Images
  const [newFormula, setNewFormula] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [savingFormula, setSavingFormula] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

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

  const saveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFormula.trim()) return;
    setSavingFormula(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/clients/${clientId}/formulas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formula: newFormula, notes: newNotes }),
      });
      if (res.ok) {
        const added = await res.json();
        setClient((prev: any) => ({ ...prev, clientFormulas: [added, ...(prev.clientFormulas || [])] }));
        setNewFormula('');
        setNewNotes('');
      }
    } finally {
      setSavingFormula(false);
    }
  };

  const saveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    setSavingImage(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/clients/${clientId}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: newImageUrl, imageType: 'AFTER' }),
      });
      if (res.ok) {
        const added = await res.json();
        setClient((prev: any) => ({ ...prev, clientHistoryImages: [added, ...(prev.clientHistoryImages || [])] }));
        setNewImageUrl('');
      }
    } finally {
      setSavingImage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <span className="bg-green-900/50 text-green-300 px-2 py-0.5 rounded text-sm font-bold border border-status-confirmed/30">COMPLETED</span>;
      case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-sm font-bold border border-status-pending/30">NO-SHOW</span>;
      case 'CANCELLED': return <span className="bg-red-900/50 text-red-300 px-2 py-0.5 rounded text-sm font-bold border border-status-cancelled/30">CANCELLED</span>;
      default: return <span className="bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded text-sm font-bold border border-status-info/30">SCHEDULED</span>;
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
    <div className="fixed inset-0 bg-botanical-surface z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-botanical-surface rounded-xl p-6 w-full max-w-2xl border border-botanical-border shadow-sm shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-6 border-b border-botanical-border pb-4">
          <div>
            <h3 className="font-bold text-botanical-accent text-2xl md:text-3xl">{clientName}</h3>
            {client && (
              <div className="text-xs text-botanical-muted mt-1 space-y-1">
                <p className="text-base md:text-lg">{client.email?.startsWith('walkin-') ? 'Walk-in Client' : client.email}</p>
                {client.phone && <p className="text-base md:text-lg">📱 {client.phone}</p>}
                {client.referralCode && <p className="text-botanical-accent/60 text-base md:text-lg">🔗 Referral: {client.referralCode}</p>}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-botanical-muted hover:text-botanical-text bg-botanical-surface rounded-full w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {loading ? (
          <p className="text-botanical-muted text-center py-8 text-base md:text-lg">Loading...</p>
        ) : client ? (
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-botanical-border mb-6 pb-2">
              {[
                { id: 'crm', label: '📝 Profile & CRM' },
                { id: 'history', label: '📅 History & Stats' },
                { id: 'formulas', label: '🧪 Color Formulas' },
                { id: 'gallery', label: '📸 Photo Gallery' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`pb-2 text-sm font-bold transition-colors ${activeTab === t.id ? 'text-botanical-accent border-b-2 border-brand-gold' : 'text-botanical-muted hover:text-botanical-text'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
              {activeTab === 'crm' && (
                <div className="space-y-4 bg-botanical-surface p-4 rounded-xl border border-botanical-border shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-botanical-muted mb-1 uppercase tracking-wider text-sm">General Notes</label>
                      <textarea
                        name="clientNotes"
                        value={formData.clientNotes}
                        onChange={handleChange}
                        placeholder="General notes..."
                        className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded-md p-2 text-sm text-botanical-text placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-y"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-botanical-muted mb-1 uppercase tracking-wider text-sm">Preferences</label>
                      <input
                        type="text"
                        name="preferences"
                        value={formData.preferences}
                        onChange={handleChange}
                        placeholder="e.g. prefers silent appointments, cold water"
                        className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded-md p-2 text-sm text-botanical-text placeholder-gray-600 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-status-cancelled/80 mb-1 uppercase tracking-wider text-sm">Allergies / Warnings</label>
                      <input
                        type="text"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        placeholder="e.g. allergic to almond oil products"
                        className="w-full bg-botanical-surface border border-status-cancelled/30 rounded-md p-2 text-sm text-botanical-text placeholder-gray-600 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-botanical-border mt-3">
                      <label className="flex items-center space-x-2 cursor-pointer text-sm">
                          <input type="checkbox" name="marketingConsent" checked={formData.marketingConsent} onChange={handleChange} className="rounded border-botanical-border bg-botanical-surface text-botanical-accent focus:ring-botanical-primary" />
                          <span className="text-sm text-botanical-muted">Accepts Email Marketing</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-sm">
                          <input type="checkbox" name="smsConsent" checked={formData.smsConsent} onChange={handleChange} className="rounded border-botanical-border bg-botanical-surface text-botanical-accent focus:ring-botanical-primary" />
                          <span className="text-sm text-botanical-muted">Accepts SMS Reminders/Promos</span>
                      </label>
                    </div>
                  </div>
                  <div className="pt-4 flex items-center justify-between border-t border-botanical-border mt-4">
                    <p className="text-botanical-muted text-base md:text-lg">Member since {new Date(client.createdAt).toLocaleDateString()}</p>
                    <button onClick={saveCrmData} disabled={savingNotes} className="bg-botanical-primary text-white px-5 py-2 rounded-md text-sm font-bold hover:bg-status-pending disabled:opacity-50 transition-colors">
                      {savingNotes ? 'Saving...' : savedNotes ? '✓ Saved' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-botanical-surface p-3 rounded-lg text-center border border-botanical-border shadow-sm">
                      <p className="font-bold text-botanical-text text-base md:text-lg">{client._count?.clientAppointments || 0}</p>
                      <p className="text-botanical-muted uppercase tracking-wider text-base md:text-lg">Visits</p>
                    </div>
                    <div className="bg-botanical-surface p-3 rounded-lg text-center border border-botanical-border shadow-sm">
                      <p className="font-bold text-status-confirmed text-base md:text-lg">
                        ${client.clientAppointments?.filter((a: any) => a.status === 'COMPLETED').reduce((sum: number, a: any) => sum + (a.totalAmount > 0 ? a.totalAmount : (a.service?.price || 0)), 0).toFixed(0) || '0'}
                      </p>
                      <p className="text-botanical-muted uppercase tracking-wider text-base md:text-lg">Spent</p>
                    </div>
                    <div className="bg-botanical-surface p-3 rounded-lg text-center border border-botanical-border shadow-sm">
                      <p className="font-bold text-status-pending text-base md:text-lg">
                        {client.clientAppointments?.filter((a: any) => a.status === 'NO_SHOW').length || 0}
                      </p>
                      <p className="text-botanical-muted uppercase tracking-wider text-base md:text-lg">No-Shows</p>
                    </div>
                  </div>
                  {loyaltyData && (
                    <div className="bg-gradient-to-r from-brand-gold/10 to-amber-900/10 border border-brand-gold/20 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <div>
                          <p className="text-botanical-muted uppercase tracking-wider text-base md:text-lg">Loyalty Points</p>
                          <p className="font-black text-botanical-accent text-base md:text-lg">{loyaltyData.pointsBalance}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-botanical-muted">
                        <p className="text-base md:text-lg">Earned: <span className="text-status-confirmed font-semibold">{loyaltyData.totalEarned}</span></p>
                        <p className="text-base md:text-lg">Redeemed: <span className="text-status-cancelled font-semibold">{loyaltyData.totalRedeemed}</span></p>
                      </div>
                    </div>
                  )}
                  <h4 className="font-semibold text-botanical-text mb-3 mt-4 text-xl md:text-2xl">Past Appointments</h4>
                  {client.clientAppointments?.length > 0 ? (
                    <div className="space-y-2">
                      {client.clientAppointments.map((apt: any) => (
                        <div key={apt.id} className="bg-botanical-surface p-3 rounded-lg border border-botanical-border shadow-sm text-sm flex flex-wrap justify-between gap-x-2 gap-y-2 items-start">
                          <div className="min-w-0">
                            <p className="font-medium text-botanical-text truncate text-base md:text-lg">{apt.service?.name || 'Walkin Service'}</p>
                            <p className="text-botanical-muted text-base md:text-lg">
                              {new Date(apt.startTime).toLocaleDateString()} {apt.staff?.name && `• ${apt.staff.name}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="font-bold text-status-confirmed text-base md:text-lg">${(apt.totalAmount > 0 ? apt.totalAmount : (apt.service?.price || 0)).toFixed(2)}</p>
                            {getStatusBadge(apt.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-botanical-muted italic py-2 text-base md:text-lg">No history yet.</p>}
                </div>
              )}

              {activeTab === 'formulas' && (
                <div className="space-y-6">
                  <form onSubmit={saveFormula} className="bg-botanical-surface p-4 rounded-xl border border-botanical-border shadow-sm">
                    <h4 className="font-semibold text-botanical-text mb-3 text-xl md:text-2xl">Add New Formula</h4>
                    <div className="space-y-3">
                      <textarea value={newFormula} onChange={e => setNewFormula(e.target.value)} placeholder="e.g. 2oz 5N + 1oz 6G + 20vol" className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded-md p-2 text-sm text-botanical-text focus:border-brand-gold resize-y" rows={2} required />
                      <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Additional notes..." className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded-md p-2 text-sm text-botanical-text focus:border-brand-gold" />
                      <button type="submit" disabled={savingFormula || !newFormula.trim()} className="bg-botanical-primary text-white px-4 py-2 rounded text-xs font-bold hover:bg-botanical-surface hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 disabled:opacity-50 transition">
                        {savingFormula ? 'Saving...' : 'Save Formula'}
                      </button>
                    </div>
                  </form>
                  <div>
                    <h4 className="font-semibold text-botanical-text mb-3 text-xl md:text-2xl">Formula History</h4>
                    {client.clientFormulas?.length > 0 ? (
                      <div className="space-y-3">
                        {client.clientFormulas.map((f: any) => (
                          <div key={f.id} className="p-3 bg-botanical-surface rounded-lg border border-botanical-border shadow-sm">
                            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-2">
                              <p className="text-botanical-muted text-base md:text-lg">{new Date(f.date).toLocaleDateString()} by {f.staff?.name}</p>
                            </div>
                            <p className="text-botanical-accent font-mono mb-1 text-base md:text-lg">{f.formula}</p>
                            {f.notes && <p className="text-botanical-muted italic text-base md:text-lg">{f.notes}</p>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-botanical-muted italic text-base md:text-lg">No formulas saved yet.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-2 items-center bg-botanical-bg p-3 rounded-lg border border-botanical-border shadow-sm">
                    <input 
                      type="url" 
                      value={newImageUrl} 
                      onChange={e => setNewImageUrl(e.target.value)} 
                      placeholder="Image URL (e.g. https://...)" 
                      className="flex-1 w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-2 text-sm text-botanical-text focus:border-brand-gold" 
                    />
                    <span className="text-botanical-muted text-xs mx-2">OR</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setSavingImage(true);
                        try {
                          const fd = new FormData();
                          fd.append('file', file);
                          fd.append('type', 'client-history');
                          const res = await fetch(`/api/shops/${shopId}/upload`, { method: 'POST', body: fd });
                          const data = await res.json();
                          if (data.error) throw new Error(data.error);
                          setNewImageUrl(data.url);
                        } catch (err: any) {
                          alert('Upload failed: ' + err.message);
                        } finally {
                          setSavingImage(false);
                        }
                      }} 
                      className="flex-1 w-full bg-botanical-surface border border-botanical-border shadow-sm rounded px-3 py-1.5 text-botanical-text text-sm focus:outline-none focus:border-brand-gold file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-botanical-primary/20 file:text-botanical-primary hover:file:bg-botanical-primary/30 hover:opacity-90" 
                    />
                    <button 
                      onClick={saveImage} 
                      disabled={savingImage || !newImageUrl.trim()} 
                      className="w-full sm:w-auto bg-botanical-primary text-white px-4 py-2 rounded text-xs font-bold hover:bg-botanical-surface hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 disabled:opacity-50"
                    >
                      {savingImage ? 'Adding...' : 'Add Photo'}
                    </button>
                  </div>
                  {client.clientHistoryImages?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {client.clientHistoryImages.map((img: any) => (
                        <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-botanical-border shadow-sm group bg-botanical-surface">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.imageUrl} alt="Client history" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2">
                            <p className="text-botanical-text text-base md:text-lg">{new Date(img.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-botanical-muted italic text-base md:text-lg">No photos uploaded yet.</p>}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-status-cancelled text-center py-8 text-base md:text-lg">Failed to load client details.</p>
        )}
      </div>
    </div>
  );
}
