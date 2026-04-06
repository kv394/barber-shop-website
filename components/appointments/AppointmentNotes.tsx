'use client';

import { useState } from 'react';

export default function AppointmentNotes({ shopId, appointmentId, initialNotes }: { shopId: string; appointmentId: string; initialNotes: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      alert('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-[10px] sm:text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        title="Add notes"
      >
        📝 {initialNotes ? 'View Notes' : 'Add Notes'}
      </button>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t border-white/5">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Haircut style, preferences, product used..."
        className="w-full bg-black/30 border border-white/10 rounded p-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-gold resize-none"
        rows={2}
      />
      <div className="flex gap-2 mt-1">
        <button onClick={handleSave} disabled={saving} className="text-[10px] bg-brand-gold/20 text-brand-gold px-2 py-0.5 rounded hover:bg-brand-gold/30 disabled:opacity-50">
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}
        </button>
        <button onClick={() => setIsOpen(false)} className="text-[10px] text-gray-500 hover:text-white px-2 py-0.5">
          Close
        </button>
      </div>
    </div>
  );
}

