'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ClientDetailProps {
  shopId: string;
  clientId: string;
  clientName: string;
  onClose: () => void;
}

export default function ClientDetailModal({ shopId, clientId, clientName, onClose }: ClientDetailProps): React.ReactNode {
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loyaltyData, setLoyaltyData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'crm' | 'history' | 'formulas' | 'gallery'>('crm');
  
  // Animation state
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsRendered(true);
    const t = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 200);
  };
  
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
      case 'COMPLETED': return <span className="bg-status-confirmed/20 text-status-confirmed px-2 py-0.5 rounded text-[13px] font-bold border border-status-confirmed/30">COMPLETED</span>;
      case 'NO_SHOW': return <span className="bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded text-[13px] font-bold border border-status-pending/30">NO-SHOW</span>;
      case 'CANCELLED': return <span className="bg-status-cancelled/20 text-status-cancelled px-2 py-0.5 rounded text-[13px] font-bold border border-status-cancelled/30">CANCELLED</span>;
      default: return <span className="bg-status-info/20 text-status-info px-2 py-0.5 rounded text-[13px] font-bold border border-status-info/30">SCHEDULED</span>;
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleClose}>
      <div className={`bg-crm-surface rounded-xl p-6 w-full max-w-2xl border border-crm-border shadow-sm shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar transition-all duration-300 transform ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={e => e.stopPropagation()}>
        <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-6 border-b border-crm-border pb-4">
          <div className="flex gap-4">
            <div>
              <h3 className="font-bold text-crm-accent text-lg font-bold">{clientName}</h3>
              {client && (
                <div className="text-[11px] text-crm-muted mt-1 space-y-1">
                  <p className="text-[13px]">{client.email?.startsWith('walkin-') ? 'Walk-in Client' : client.email}</p>
                  {client.phone && <p className="text-[13px]">📱 {client.phone}</p>}
                  {client.referralCode && <p className="text-crm-accent/60 text-[13px]">🔗 Referral: {client.referralCode}</p>}
                </div>
              )}
            </div>
            {client?.barcode && (
              <div className="shrink-0 flex items-start border-l border-crm-border pl-4 ml-2">
                <UserQRCode barcode={client.barcode} userName={client.name || clientName} showText={false} size={64} />
              </div>
            )}
          </div>
          <button onClick={handleClose} className="text-crm-muted hover:text-crm-text bg-crm-surface rounded-full w-8 h-8 flex items-center justify-center">✕</button>
        </div>

        {loading ? (
          <p className="text-crm-muted text-center py-8 text-[13px]">Loading...</p>
        ) : client ? (
          <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-crm-border mb-6 pb-2">
              {[
                { id: 'crm', label: '📝 Profile & CRM' },
                { id: 'history', label: '📅 History & Stats' },
                { id: 'formulas', label: '🧪 Color Formulas' },
                { id: 'gallery', label: '📸 Photo Gallery' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`pb-2 text-[13px] font-bold transition-colors ${activeTab === t.id ? 'text-crm-accent border-b-2 border-brand-gold' : 'text-crm-muted hover:text-crm-text'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
              {activeTab === 'crm' && (
                <div className="space-y-4 bg-crm-surface p-4 rounded-xl border border-crm-border shadow-sm">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">General Notes</label>
                      <textarea
                        name="clientNotes"
                        value={formData.clientNotes}
                        onChange={handleChange}
                        placeholder="General notes..."
                        className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2 text-[13px] text-crm-text placeholder-gray-600 focus:outline-none focus:border-brand-gold resize-y"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-crm-muted mb-1 uppercase tracking-wider text-[13px]">Preferences</label>
                      <input
                        type="text"
                        name="preferences"
                        value={formData.preferences}
                        onChange={handleChange}
                        placeholder="e.g. prefers silent appointments, cold water"
                        className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2 text-[13px] text-crm-text placeholder-gray-600 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-status-cancelled/80 mb-1 uppercase tracking-wider text-[13px]">Allergies / Warnings</label>
                      <input
                        type="text"
                        name="allergies"
                        value={formData.allergies}
                        onChange={handleChange}
                        placeholder="e.g. allergic to almond oil products"
                        className="w-full bg-crm-surface border border-status-cancelled/30 rounded-md p-2 text-[13px] text-crm-text placeholder-gray-600 focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-crm-border mt-3">
                      <label className="flex items-center space-x-2 cursor-pointer text-[13px]">
                          <input type="checkbox" name="marketingConsent" checked={formData.marketingConsent} onChange={handleChange} className="rounded border-crm-border bg-crm-surface text-crm-accent focus:ring-crm-primary" />
                          <span className="text-[13px] text-crm-muted">Accepts Email Marketing</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-[13px]">
                          <input type="checkbox" name="smsConsent" checked={formData.smsConsent} onChange={handleChange} className="rounded border-crm-border bg-crm-surface text-crm-accent focus:ring-crm-primary" />
                          <span className="text-[13px] text-crm-muted">Accepts SMS Reminders/Promos</span>
                      </label>
                    </div>
                  </div>
                  <div className="pt-4 flex items-center justify-between border-t border-crm-border mt-4">
                    <p className="text-crm-muted text-[13px]">Member since {new Date(client.createdAt).toLocaleDateString()}</p>
                    <button onClick={saveCrmData} disabled={savingNotes} className="bg-crm-primary text-white px-5 py-2 rounded-md text-[13px] font-bold hover:bg-status-pending disabled:opacity-50 transition-colors">
                      {savingNotes ? 'Saving...' : savedNotes ? '✓ Saved' : 'Save Profile'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-crm-surface p-3 rounded-lg text-center border border-crm-border shadow-sm">
                      <p className="font-bold text-crm-text text-[13px]">{client._count?.clientAppointments || 0}</p>
                      <p className="text-crm-muted uppercase tracking-wider text-[13px]">Visits</p>
                    </div>
                    <div className="bg-crm-surface p-3 rounded-lg text-center border border-crm-border shadow-sm">
                      <p className="font-bold text-status-confirmed text-[13px]">
                        ${client.clientAppointments?.filter((a: any) => a.status === 'COMPLETED').reduce((sum: number, a: any) => sum + (a.totalAmount > 0 ? a.totalAmount : (a.service?.price || 0)), 0).toFixed(0) || '0'}
                      </p>
                      <p className="text-crm-muted uppercase tracking-wider text-[13px]">Spent</p>
                    </div>
                    <div className="bg-crm-surface p-3 rounded-lg text-center border border-crm-border shadow-sm">
                      <p className="font-bold text-status-pending text-[13px]">
                        {client.clientAppointments?.filter((a: any) => a.status === 'NO_SHOW').length || 0}
                      </p>
                      <p className="text-crm-muted uppercase tracking-wider text-[13px]">No-Shows</p>
                    </div>
                  </div>
                  {loyaltyData && (
                    <div className="bg-gradient-to-r from-brand-gold/10 to-amber-900/10 border border-brand-gold/20 p-3 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <div>
                          <p className="text-crm-muted uppercase tracking-wider text-[13px]">Loyalty Points</p>
                          <p className="font-black text-crm-accent text-[13px]">{loyaltyData.pointsBalance}</p>
                        </div>
                      </div>
                      <div className="text-right text-[13px] text-crm-muted">
                        <p className="text-[13px]">Earned: <span className="text-status-confirmed font-semibold">{loyaltyData.totalEarned}</span></p>
                        <p className="text-[13px]">Redeemed: <span className="text-status-cancelled font-semibold">{loyaltyData.totalRedeemed}</span></p>
                      </div>
                    </div>
                  )}
                  <h4 className="font-semibold text-crm-text mb-3 mt-4 text-base font-semibold">Past Appointments</h4>
                  {client.clientAppointments?.length > 0 ? (
                    <div className="space-y-2">
                      {client.clientAppointments.map((apt: any) => (
                        <div key={apt.id} className="bg-crm-surface p-3 rounded-lg border border-crm-border shadow-sm text-[13px] flex flex-wrap justify-between gap-x-2 gap-y-2 items-start">
                          <div className="min-w-0">
                            <p className="font-medium text-crm-text truncate text-[13px]">{apt.service?.name || 'Walkin Service'}</p>
                            <p className="text-crm-muted text-[13px]">
                              {new Date(apt.startTime).toLocaleDateString()} {apt.staff?.name && `• ${apt.staff.name}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <p className="font-bold text-status-confirmed text-[13px]">${(apt.totalAmount > 0 ? apt.totalAmount : (apt.service?.price || 0)).toFixed(2)}</p>
                            {getStatusBadge(apt.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-crm-muted italic py-2 text-[13px]">No history yet.</p>}
                </div>
              )}

              {activeTab === 'formulas' && (
                <div className="space-y-6">
                  <form onSubmit={saveFormula} className="bg-crm-surface p-4 rounded-xl border border-crm-border shadow-sm">
                    <h4 className="font-semibold text-crm-text mb-3 text-base font-semibold">Add New Formula</h4>
                    <div className="space-y-3">
                      <textarea value={newFormula} onChange={e => setNewFormula(e.target.value)} placeholder="e.g. 2oz 5N + 1oz 6G + 20vol" className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2 text-[13px] text-crm-text focus:border-brand-gold resize-y" rows={2} required />
                      <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Additional notes..." className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-md p-2 text-[13px] text-crm-text focus:border-brand-gold" />
                      <button type="submit" disabled={savingFormula || !newFormula.trim()} className="bg-crm-primary text-white px-4 py-2 rounded text-[11px] font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 disabled:opacity-50 transition">
                        {savingFormula ? 'Saving...' : 'Save Formula'}
                      </button>
                    </div>
                  </form>
                  <div>
                    <h4 className="font-semibold text-crm-text mb-3 text-base font-semibold">Formula History</h4>
                    {client.clientFormulas?.length > 0 ? (
                      <div className="space-y-3">
                        {client.clientFormulas.map((f: any) => (
                          <div key={f.id} className="p-3 bg-crm-surface rounded-lg border border-crm-border shadow-sm">
                            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-start mb-2">
                              <p className="text-crm-muted text-[13px]">{new Date(f.date).toLocaleDateString()} by {f.staff?.name}</p>
                            </div>
                            <p className="text-crm-accent font-mono mb-1 text-[13px]">{f.formula}</p>
                            {f.notes && <p className="text-crm-muted italic text-[13px]">{f.notes}</p>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-crm-muted italic text-[13px]">No formulas saved yet.</p>}
                  </div>
                </div>
              )}

              {activeTab === 'gallery' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-2 items-center bg-crm-bg p-3 rounded-lg border border-crm-border shadow-sm">
                    <input 
                      type="url" 
                      value={newImageUrl} 
                      onChange={e => setNewImageUrl(e.target.value)} 
                      placeholder="Image URL (e.g. https://...)" 
                      className="flex-1 w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-2 text-[13px] text-crm-text focus:border-brand-gold" 
                    />
                    <span className="text-crm-muted text-[11px] mx-2">OR</span>
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
                      className="flex-1 w-full bg-crm-surface border border-crm-border shadow-sm rounded px-3 py-1.5 text-crm-text text-[13px] focus:outline-none focus:border-brand-gold file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-[11px] file:bg-crm-primary/20 file:text-crm-primary hover:file:bg-crm-primary/30 hover:opacity-90" 
                    />
                    <button 
                      onClick={saveImage} 
                      disabled={savingImage || !newImageUrl.trim()} 
                      className="w-full sm:w-auto bg-crm-primary text-white px-4 py-2 rounded text-[11px] font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 disabled:opacity-50"
                    >
                      {savingImage ? 'Adding...' : 'Add Photo'}
                    </button>
                  </div>
                  {client.clientHistoryImages?.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {client.clientHistoryImages.map((img: any) => (
                        <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden border border-crm-border shadow-sm group bg-crm-surface">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.imageUrl} alt="Client history" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-2">
                            <p className="text-crm-text text-[13px]">{new Date(img.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-crm-muted italic text-[13px]">No photos uploaded yet.</p>}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-status-cancelled text-center py-8 text-[13px]">Failed to load client details.</p>
        )}
      </div>
    </div>
  );

  return isRendered && mounted ? createPortal(modalContent, document.body) : null;
}
