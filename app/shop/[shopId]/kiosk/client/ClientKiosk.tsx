'use client';

import { useState } from 'react';

export default function ClientKiosk({ shopName, shopId, services }: { shopName: string, shopId: string, services: any[] }) {
  const [mode, setMode] = useState<'HOME' | 'CHECK_IN' | 'WALK_IN' | 'SUCCESS'>('HOME');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Check-in state
  const [phone, setPhone] = useState('');
  
  // Walk-in state
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInService, setWalkInService] = useState('');

  const handleCheckIn = async () => {
    if (!phone) { setError('Phone number required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/shops/${shopId}/kiosk/client/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check in');
      setMode('SUCCESS');
      setTimeout(reset, 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWalkIn = async () => {
    if (!walkInName) { setError('Name is required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/shops/${shopId}/kiosk/client/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName: walkInName, clientPhone: walkInPhone, serviceId: walkInService }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join waitlist');
      setMode('SUCCESS');
      setTimeout(reset, 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMode('HOME');
    setPhone('');
    setWalkInName('');
    setWalkInPhone('');
    setWalkInService('');
    setError('');
  };

  return (
    <div className="w-full max-w-2xl bg-white/5 border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl backdrop-blur-xl">
      {mode === 'HOME' && (
        <div className="text-center space-y-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 text-white">Welcome to {shopName}</h1>
            <p className="text-white/50 text-lg">Please check in or join the waitlist</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => setMode('CHECK_IN')} className="h-48 bg-amber-500 hover:bg-amber-400 text-black rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors shadow-lg shadow-amber-500/20 group">
              <span className="text-5xl group-hover:scale-110 transition-transform">📅</span>
              <span className="text-xl font-black uppercase tracking-wide">I have an Appointment</span>
            </button>
            <button onClick={() => setMode('WALK_IN')} className="h-48 bg-white/10 hover:bg-white/15 text-white rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors border border-white/10 group">
              <span className="text-5xl group-hover:scale-110 transition-transform">🚶</span>
              <span className="text-xl font-black uppercase tracking-wide">Walk-In</span>
            </button>
          </div>
        </div>
      )}

      {mode === 'CHECK_IN' && (
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <button onClick={reset} className="text-white/40 hover:text-white text-3xl transition-colors">←</button>
            <h2 className="text-3xl font-black">Check In</h2>
          </div>
          <div className="space-y-4">
            <label className="block text-white/60 text-lg">Enter your phone number</label>
            <input 
              type="tel" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 555-0123"
              className="w-full bg-black/30 border-2 border-white/10 focus:border-amber-500 rounded-2xl px-6 py-6 text-2xl text-white outline-none transition-colors"
              autoFocus
            />
          </div>
          {error && <p className="text-red-400 font-bold bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</p>}
          <button 
            onClick={handleCheckIn} 
            disabled={loading}
            className="w-full py-6 bg-amber-500 hover:bg-amber-400 text-black font-black text-xl rounded-2xl transition-colors shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? 'Checking in...' : 'Check In'}
          </button>
        </div>
      )}

      {mode === 'WALK_IN' && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button onClick={reset} className="text-white/40 hover:text-white text-3xl transition-colors">←</button>
            <h2 className="text-3xl font-black">Join Waitlist</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-white/60 text-sm uppercase tracking-wider font-bold mb-2">Your Name *</label>
              <input type="text" value={walkInName} onChange={e => setWalkInName(e.target.value)} className="w-full bg-black/30 border-2 border-white/10 focus:border-amber-500 rounded-xl px-4 py-4 text-xl text-white outline-none transition-colors" autoFocus />
            </div>
            <div>
              <label className="block text-white/60 text-sm uppercase tracking-wider font-bold mb-2">Phone Number</label>
              <input type="tel" value={walkInPhone} onChange={e => setWalkInPhone(e.target.value)} placeholder="So we can text you" className="w-full bg-black/30 border-2 border-white/10 focus:border-amber-500 rounded-xl px-4 py-4 text-xl text-white outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-white/60 text-sm uppercase tracking-wider font-bold mb-2">Service (Optional)</label>
              <select value={walkInService} onChange={e => setWalkInService(e.target.value)} className="w-full bg-black/30 border-2 border-white/10 focus:border-amber-500 rounded-xl px-4 py-4 text-xl text-white outline-none transition-colors appearance-none">
                <option value="">Any Service</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 font-bold bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</p>}
          <button 
            onClick={handleWalkIn} 
            disabled={loading}
            className="w-full py-6 bg-white hover:bg-gray-200 text-black font-black text-xl rounded-2xl transition-colors shadow-lg shadow-white/10 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Join Waitlist'}
          </button>
        </div>
      )}

      {mode === 'SUCCESS' && (
        <div className="text-center space-y-6 py-12">
          <div className="w-24 h-24 bg-emerald-500/20 border-2 border-emerald-500/50 rounded-full flex items-center justify-center text-5xl mx-auto shadow-lg shadow-emerald-500/20">
            ✅
          </div>
          <h2 className="text-4xl font-black text-white">You're all set!</h2>
          <p className="text-white/50 text-xl">Please take a seat. We'll be with you shortly.</p>
        </div>
      )}
    </div>
  );
}
