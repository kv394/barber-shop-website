'use client';

import { useState, useEffect } from 'react';

export default function WaitlistClient({ shopId, services, staff }: { shopId: string; services: any[]; staff: any[] }) {
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [adding, setAdding] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null); // which waitlist entry we're picking a barber for

  const fetchWaitlist = async () => {
    const res = await fetch(`/api/shops/${shopId}/waitlist`);
    if (res.ok) setWaitlist(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchWaitlist(); }, []);
  useEffect(() => { const i = setInterval(fetchWaitlist, 30000); return () => clearInterval(i); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/shops/${shopId}/waitlist`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName, clientPhone, serviceId: serviceId || undefined, staffId: staffId || undefined }),
    });
    if (res.ok) { setClientName(''); setClientPhone(''); setServiceId(''); setStaffId(''); fetchWaitlist(); }
    setAdding(false);
  };

  const updateStatus = async (id: string, status?: string, incomingStaffId?: string | null) => {
    await fetch(`/api/shops/${shopId}/waitlist`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, staffId: incomingStaffId }),
    });
    setAssigningId(null);
    fetchWaitlist();
  };

  const handleServe = (entryId: string) => {
    if (staff.length > 0) {
      setAssigningId(entryId);
    } else {
      updateStatus(entryId, 'SERVING');
    }
  };

  const waiting = waitlist.filter(w => w.status === 'WAITING');
  const serving = waitlist.filter(w => w.status === 'SERVING');
  const inputStyle: React.CSSProperties = {};
  const getWaitTime = (c: string) => { const m = Math.floor((Date.now() - new Date(c).getTime()) / 60000); return m < 1 ? 'Just now' : `${m} min`; };
  const getStaffName = (staffId: string | null) => { 
    if (!staffId) return null; 
    const s = staff.find(x => x.id === staffId);
    return s ? (s.name || (s.email ? s.email.split('@')[0] : 'Staff')) : null;
  };

  return (
    <div>
      <div className="bg-botanical-surface backdrop-blur-xl shadow-2xl rounded-2xl border border-botanical-border shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2 mb-2 sm:mb-6">
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-info/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-2 sm:mb-3">
            <h3 className="text-botanical-muted uppercase tracking-widest font-semibold truncate text-xs">Waiting</h3>
            <span className="text-status-info text-sm">⏳</span>
          </div>
          <p className="font-black text-botanical-text break-words leading-tight text-3xl md:text-4xl">{waiting.length}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-status-confirmed/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-2 sm:mb-3">
            <h3 className="text-botanical-muted uppercase tracking-widest font-semibold truncate text-xs">Being Served</h3>
            <span className="text-status-confirmed text-sm">✂️</span>
          </div>
          <p className="font-black text-botanical-text break-words leading-tight text-3xl md:text-4xl">{serving.length}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-botanical-surface transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-botanical-accent/80"></div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center mb-2 sm:mb-3">
            <h3 className="text-botanical-muted uppercase tracking-widest font-semibold truncate text-xs">Est. Wait</h3>
            <span className="text-botanical-accent text-sm">⏱️</span>
          </div>
          <p className="font-black text-botanical-text break-words leading-tight text-3xl md:text-4xl">{waiting.length > 0 ? `~${waiting.length * 15}m` : '0m'}</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-botanical-surface p-4 rounded-lg border border-botanical-border shadow-sm mb-6 space-y-3">
        <h3 className="font-bold text-botanical-text text-2xl md:text-3xl">+ Add Walk-in</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name *" required style={inputStyle} className="border border-botanical-border shadow-sm rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold" />
          <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Phone (optional)" style={inputStyle} className="border border-botanical-border shadow-sm rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold" />
          <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={inputStyle} className="border border-botanical-border shadow-sm rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold">
            <option value="">Any Service</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}m)</option>)}
          </select>
          <select value={staffId} onChange={e => setStaffId(e.target.value)} style={inputStyle} className="border border-botanical-border shadow-sm rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold">
            <option value="">No Preference</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name || (s.email ? s.email.split('@')[0] : 'Staff')}</option>)}
          </select>
          <button type="submit" disabled={adding} className="bg-botanical-primary text-white hover:bg-botanical-surface hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 font-bold py-2.5 rounded text-sm disabled:opacity-50">{adding ? 'Adding...' : 'Add'}</button>
        </div>
      </form>

      {loading ? <p className="text-botanical-muted text-center py-8 text-base md:text-lg">Loading...</p> : (
        <div className="space-y-3">
          {serving.map(entry => (
            <div key={entry.id} className="bg-status-confirmed/20 p-4 rounded-lg border border-status-confirmed/30 flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-status-confirmed flex items-center justify-center text-botanical-text font-bold text-sm">✂️</div>
                <div>
                  <p className="font-bold text-botanical-text text-3xl md:text-4xl">{entry.clientName}</p>
                  <p className="text-status-confirmed text-base md:text-lg">Being served · {getWaitTime(entry.createdAt)} ago</p>
                  {entry.staffId && <p className="text-botanical-accent text-base md:text-lg">✂️ {getStaffName(entry.staffId)}</p>}
                  {entry.clientPhone && <p className="text-botanical-muted text-base md:text-lg">📱 {entry.clientPhone}</p>}
                </div>
              </div>
              <button onClick={() => updateStatus(entry.id, 'DONE')} className="bg-status-confirmed hover:bg-status-confirmed text-botanical-text text-xs font-bold px-3 py-1.5 rounded">Done ✓</button>
            </div>
          ))}
          {waiting.map((entry, idx) => (
            <div key={entry.id} className="bg-botanical-surface p-4 rounded-lg border border-botanical-border shadow-sm">
              <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-botanical-surface flex items-center justify-center text-botanical-text font-bold text-sm">{idx + 1}</div>
                  <div>
                    <p className="font-bold text-botanical-text text-3xl md:text-4xl">{entry.clientName}</p>
                    <p className="text-botanical-muted text-base md:text-lg">Waiting · {getWaitTime(entry.createdAt)}</p>
                    {entry.staffId && <p className="text-botanical-accent text-base md:text-lg">✂️ {getStaffName(entry.staffId)}</p>}
                    {entry.clientPhone && <p className="text-botanical-muted text-base md:text-lg">📱 {entry.clientPhone}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAssigningId(entry.id)} className="bg-botanical-accent/20 hover:bg-botanical-accent/20 text-botanical-accent border border-botanical-accent/30 text-xs px-2 py-1.5 rounded">Reassign Barber</button>
                  <button onClick={() => handleServe(entry.id)} className="bg-botanical-primary text-white hover:bg-botanical-surface hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 text-xs font-bold px-3 py-1.5 rounded">Serve</button>
                  <button onClick={() => updateStatus(entry.id, 'LEFT')} className="bg-botanical-surface hover:bg-botanical-border text-botanical-muted text-xs px-2 py-1.5 rounded">Left</button>
                </div>
              </div>
              {/* Staff Picker Dropdown */}
              {assigningId === entry.id && (
                <div className="mt-3 pt-3 border-t border-botanical-border">
                  <p className="text-botanical-muted uppercase tracking-wider mb-2 text-base md:text-lg">Assign barber:</p>
                  <div className="flex flex-wrap gap-2">
                    {staff.map(s => (
                      <button key={s.id} onClick={() => updateStatus(entry.id, undefined, s.id)}
                        className="bg-botanical-accent/20 hover:bg-botanical-accent/20 text-botanical-accent border border-botanical-accent/30 text-xs font-bold px-3 py-1.5 rounded transition-colors">
                        ✂️ {s.name || (s.email ? s.email.split('@')[0] : 'Staff')}
                      </button>
                    ))}
                    <button onClick={() => updateStatus(entry.id, undefined, null)}
                      className="bg-botanical-surface hover:bg-botanical-surface text-botanical-muted text-xs px-3 py-1.5 rounded border border-botanical-border shadow-sm transition-colors">
                      Remove assignment
                    </button>
                    <button onClick={() => setAssigningId(null)}
                      className="text-botanical-muted hover:text-botanical-text text-xs px-2 py-1.5">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {waiting.length === 0 && serving.length === 0 && (
            <p className="text-botanical-muted italic text-center py-8 border border-dashed border-botanical-border rounded text-base md:text-lg">No one in the queue. Add walk-in clients above.</p>
          )}
        </div>
      )}
    </div>
  );
}
