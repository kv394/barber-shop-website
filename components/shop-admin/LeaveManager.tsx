'use client';

import { useState, useEffect } from 'react';

interface Leave {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
}

export default function LeaveManager({ shopId, userId }: { shopId: string, userId: string }) {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, [shopId, userId]);

  const fetchLeaves = async () => {
    try {
      const res = await fetch(`/api/shops/${shopId}/leave?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Create full ISO strings for startTime and endTime
      const startDateTime = new Date(`${date}T${startTime}:00Z`).toISOString();
      const endDateTime = new Date(`${date}T${endTime}:00Z`).toISOString();

      const res = await fetch(`/api/shops/${shopId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          date: new Date(date).toISOString(),
          startTime: startDateTime,
          endTime: endDateTime,
          reason
        })
      });

      if (res.ok) {
        setDate('');
        setStartTime('');
        setEndTime('');
        setReason('');
        fetchLeaves();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to add leave');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (leaveId: string) => {
    if (!confirm('Are you sure you want to delete this leave?')) return;
    
    try {
      const res = await fetch(`/api/shops/${shopId}/leave/${leaveId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchLeaves();
      }
    } catch (err) {
      alert('Network error');
    }
  };

  if (loading) return <div className="text-botanical-text">Loading leaves...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border">
        <h3 className="text-xl font-bold text-botanical-text mb-4">Request Time Off</h3>
        <form onSubmit={handleAddLeave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-botanical-muted mb-1">Date</label>
              <input 
                type="date" 
                required 
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full bg-botanical-surface border border-botanical-border rounded-lg px-3 py-2 text-botanical-text focus:border-brand-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-botanical-muted mb-1">Start Time</label>
              <input 
                type="time" 
                required 
                value={startTime} 
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-botanical-surface border border-botanical-border rounded-lg px-3 py-2 text-botanical-text focus:border-brand-gold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-botanical-muted mb-1">End Time</label>
              <input 
                type="time" 
                required 
                value={endTime} 
                onChange={e => setEndTime(e.target.value)}
                className="w-full bg-botanical-surface border border-botanical-border rounded-lg px-3 py-2 text-botanical-text focus:border-brand-gold outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-botanical-muted mb-1">Reason (Optional)</label>
            <input 
              type="text" 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Doctor appointment, Sick, Vacation"
              className="w-full bg-botanical-surface border border-botanical-border rounded-lg px-3 py-2 text-botanical-text focus:border-brand-gold outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={saving}
            className="bg-botanical-primary text-black font-bold px-4 py-2 rounded hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {saving ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      <div className="bg-botanical-surface p-6 rounded-xl border border-botanical-border">
        <h3 className="text-xl font-bold text-botanical-text mb-4">Upcoming & Past Leaves</h3>
        {leaves.length === 0 ? (
          <p className="text-sm text-botanical-muted italic">No leaves recorded.</p>
        ) : (
          <div className="space-y-3">
            {leaves.map(leave => (
              <div key={leave.id} className="flex justify-between items-center bg-botanical-surface p-4 rounded-lg border border-botanical-border">
                <div>
                  <p className="font-bold text-botanical-accent">
                    {new Date(leave.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-botanical-text">
                    {new Date(leave.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(leave.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {leave.reason && <p className="text-xs text-botanical-muted mt-1">Note: {leave.reason}</p>}
                </div>
                <button 
                  onClick={() => handleDelete(leave.id)}
                  className="text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wider px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
