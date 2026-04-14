'use client';

import { useState } from 'react';

interface Props {
  shopId: string;
  appointmentId: string;
  initialNotes: string | null;
  clientNotes?: string | null;
  allergies?: string | null;
  preferences?: string | null;
}

export default function AppointmentNotes({ shopId, appointmentId, initialNotes, clientNotes, allergies, preferences }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasClientInfo = clientNotes || allergies || preferences;

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
        className={`text-sm sm:text-xs transition-colors flex items-center gap-1 mt-2 ${hasClientInfo ? 'text-status-pending hover:text-amber-300' : 'text-botanical-muted hover:text-botanical-text'}`}
        title="View Notes"
      >
        📝 {hasClientInfo ? 'View Client Notes' : initialNotes ? 'View Appointment Notes' : 'Add Notes'}
      </button>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-botanical-border space-y-3">
      {hasClientInfo && (
        <div className="bg-botanical-surface p-2 rounded border border-status-pending/20">
          <h5 className="text-sm uppercase tracking-wider text-status-pending font-bold mb-1">Client Profile</h5>
          {clientNotes && <p className="text-botanical-muted mb-1 text-base md:text-lg"><span className="text-botanical-muted font-semibold">Notes:</span> {clientNotes}</p>}
          {preferences && <p className="text-botanical-muted mb-1 text-base md:text-lg"><span className="text-botanical-muted font-semibold">Prefs:</span> {preferences}</p>}
          {allergies && <p className="text-status-cancelled text-base md:text-lg"><span className="text-status-cancelled font-semibold">Allergies:</span> {allergies}</p>}
        </div>
      )}

      <div>
        <h5 className="text-sm uppercase tracking-wider text-botanical-muted font-bold mb-1">Appointment Notes</h5>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Haircut style, specific product used today..."
          className="w-full bg-botanical-surface border border-botanical-border shadow-sm rounded p-2 text-xs text-botanical-text placeholder-gray-500 focus:outline-none focus:border-brand-gold resize-none"
          rows={2}
        />
        <div className="flex gap-2 mt-1">
          <button onClick={handleSave} disabled={saving} className="text-sm bg-botanical-primary/20 text-botanical-accent px-2 py-0.5 rounded hover:bg-botanical-primary/30 disabled:opacity-50">
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Notes'}
          </button>
          <button onClick={() => setIsOpen(false)} className="text-sm text-botanical-muted hover:text-botanical-text px-2 py-0.5">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

