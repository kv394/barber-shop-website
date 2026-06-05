import Image from 'next/image';
import React from 'react';

export function ClientFormulasTab({
  client,
  newFormula,
  setNewFormula,
  newNotes,
  setNewNotes,
  savingFormula,
  saveFormula
}: any) {
  return (
    <div className="space-y-6">
      <form onSubmit={saveFormula} className="bg-crm-surface p-4 rounded-xl border border-crm-border shadow-sm">
        <h4 className="font-semibold text-crm-text mb-3 text-base font-semibold">Add New Formula</h4>
        <div className="space-y-3">
          <textarea value={newFormula} onChange={e => setNewFormula(e.target.value)} placeholder="e.g. 2oz 5N + 1oz 6G + 20vol" className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-2 text-[13px] text-crm-text focus:border-brand-indigo resize-y" rows={2} required />
          <input type="text" value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Additional notes..." className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-2 text-[13px] text-crm-text focus:border-brand-indigo" />
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
  );
}
