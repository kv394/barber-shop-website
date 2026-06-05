'use client';;
import Image from 'next/image';

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
 className={`text-[13px] sm:text-[11px] transition-colors flex items-center gap-1 mt-2 ${hasClientInfo ? 'text-status-pending hover:text-amber-300' : 'text-crm-muted hover:text-crm-text'}`}
 title="View Notes"
 >
 📝 {hasClientInfo ? 'View Client Notes' : initialNotes ? 'View Appointment Notes' : 'Add Notes'}
 </button>
 );
 }

 return (
 <div className="mt-3 pt-3 border-t border-crm-border space-y-3">
 {hasClientInfo && (
 <div className="bg-crm-surface p-2 rounded border border-status-pending/20">
 <h5 className="text-[13px] uppercase tracking-wider text-status-pending font-bold mb-1">Client Profile</h5>
 {clientNotes && <p className="text-crm-muted mb-1 text-[13px]"><span className="text-crm-muted font-semibold">Notes:</span> {clientNotes}</p>}
 {preferences && <p className="text-crm-muted mb-1 text-[13px]"><span className="text-crm-muted font-semibold">Prefs:</span> {preferences}</p>}
 {allergies && <p className="text-status-cancelled text-[13px]"><span className="text-status-cancelled font-semibold">Allergies:</span> {allergies}</p>}
 </div>
 )}

 <div>
 <h5 className="text-[13px] uppercase tracking-wider text-crm-muted font-bold mb-1">Appointment Notes</h5>
 <textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="Haircut style, specific product used today..."
 className="w-full bg-crm-surface border border-crm-border shadow-sm rounded p-2 text-[11px] text-crm-text placeholder-gray-500 focus:outline-none focus:border-brand-indigo resize-none"
 rows={2}
 />
 <div className="flex gap-2 mt-1">
 <button onClick={handleSave} disabled={saving} className="text-[13px] bg-crm-primary/20 text-crm-accent px-2 py-0.5 rounded hover:bg-crm-primary/30 disabled:opacity-50">
 {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Notes'}
 </button>
 <button onClick={() => setIsOpen(false)} className="text-[13px] text-crm-muted hover:text-crm-text px-2 py-0.5">
 Close
 </button>
 </div>
 </div>
 </div>
 );
}

