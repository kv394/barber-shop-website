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
  const inputStyle: React.CSSProperties = { colorScheme: 'dark', color: '#fff', backgroundColor: 'rgba(0,0,0,0.5)' };
  const getWaitTime = (c: string) => { const m = Math.floor((Date.now() - new Date(c).getTime()) / 60000); return m < 1 ? 'Just now' : `${m} min`; };
  const getStaffName = (staffId: string | null) => { 
    if (!staffId) return null; 
    const s = staff.find(x => x.id === staffId);
    return s ? (s.name || (s.email ? s.email.split('@')[0] : 'Staff')) : null;
  };

  return (
    <div>
      <div className="bg-slate-900/80 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/10 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-20 overflow-hidden transform sm:-translate-y-6 sm:-mx-2 mb-2 sm:mb-6">
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/80"></div>
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Waiting</h3>
            <span className="text-blue-500 text-sm">⏳</span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white break-words leading-tight">{waiting.length}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500/80"></div>
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Being Served</h3>
            <span className="text-green-500 text-sm">✂️</span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white break-words leading-tight">{serving.length}</p>
        </div>
        <div className="flex-1 p-5 sm:p-6 relative overflow-hidden group hover:bg-white/5 transition-all duration-300 min-w-0">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/80"></div>
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-widest font-semibold truncate">Est. Wait</h3>
            <span className="text-purple-500 text-sm">⏱️</span>
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white break-words leading-tight">{waiting.length > 0 ? `~${waiting.length * 15}m` : '0m'}</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-slate-900/50 p-4 rounded-lg border border-white/5 mb-6 space-y-3">
        <h3 className="text-sm font-bold text-white">+ Add Walk-in</h3>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name *" required style={inputStyle} className="border border-white/10 rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold" />
          <input type="tel" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Phone (optional)" style={inputStyle} className="border border-white/10 rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold" />
          <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={inputStyle} className="border border-white/10 rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold">
            <option value="">Any Service</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration}m)</option>)}
          </select>
          <select value={staffId} onChange={e => setStaffId(e.target.value)} style={inputStyle} className="border border-white/10 rounded p-2.5 text-sm focus:outline-none focus:border-brand-gold">
            <option value="">No Preference</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.name || (s.email ? s.email.split('@')[0] : 'Staff')}</option>)}
          </select>
          <button type="submit" disabled={adding} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded text-sm disabled:opacity-50">{adding ? 'Adding...' : 'Add'}</button>
        </div>
      </form>

      {loading ? <p className="text-gray-400 text-center py-8">Loading...</p> : (
        <div className="space-y-3">
          {serving.map(entry => (
            <div key={entry.id} className="bg-green-900/20 p-4 rounded-lg border border-green-500/30 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm">✂️</div>
                <div>
                  <p className="text-sm font-bold text-white">{entry.clientName}</p>
                  <p className="text-[10px] text-green-400">Being served · {getWaitTime(entry.createdAt)} ago</p>
                  {entry.staffId && <p className="text-[10px] text-purple-400">✂️ {getStaffName(entry.staffId)}</p>}
                  {entry.clientPhone && <p className="text-[10px] text-gray-500">📱 {entry.clientPhone}</p>}
                </div>
              </div>
              <button onClick={() => updateStatus(entry.id, 'DONE')} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded">Done ✓</button>
            </div>
          ))}
          {waiting.map((entry, idx) => (
            <div key={entry.id} className="bg-slate-900/70 p-4 rounded-lg border border-white/10">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">{idx + 1}</div>
                  <div>
                    <p className="text-sm font-bold text-white">{entry.clientName}</p>
                    <p className="text-[10px] text-gray-400">Waiting · {getWaitTime(entry.createdAt)}</p>
                    {entry.staffId && <p className="text-[10px] text-purple-400">✂️ {getStaffName(entry.staffId)}</p>}
                    {entry.clientPhone && <p className="text-[10px] text-gray-500">📱 {entry.clientPhone}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAssigningId(entry.id)} className="bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 border border-purple-500/30 text-xs px-2 py-1.5 rounded">Reassign Barber</button>
                  <button onClick={() => handleServe(entry.id)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded">Serve</button>
                  <button onClick={() => updateStatus(entry.id, 'LEFT')} className="bg-slate-700 hover:bg-slate-600 text-gray-300 text-xs px-2 py-1.5 rounded">Left</button>
                </div>
              </div>
              {/* Staff Picker Dropdown */}
              {assigningId === entry.id && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Assign barber:</p>
                  <div className="flex flex-wrap gap-2">
                    {staff.map(s => (
                      <button key={s.id} onClick={() => updateStatus(entry.id, undefined, s.id)}
                        className="bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 border border-purple-500/30 text-xs font-bold px-3 py-1.5 rounded transition-colors">
                        ✂️ {s.name || (s.email ? s.email.split('@')[0] : 'Staff')}
                      </button>
                    ))}
                    <button onClick={() => updateStatus(entry.id, undefined, null)}
                      className="bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs px-3 py-1.5 rounded border border-white/10 transition-colors">
                      Remove assignment
                    </button>
                    <button onClick={() => setAssigningId(null)}
                      className="text-gray-500 hover:text-white text-xs px-2 py-1.5">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {waiting.length === 0 && serving.length === 0 && (
            <p className="text-gray-500 italic text-center py-8 text-sm border border-dashed border-white/20 rounded">No one in the queue. Add walk-in clients above.</p>
          )}
        </div>
      )}
    </div>
  );
}
