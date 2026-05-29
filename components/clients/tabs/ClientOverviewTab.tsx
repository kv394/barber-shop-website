import React from 'react';

export function ClientOverviewTab({
  formData,
  handleChange,
  isRecording,
  isProcessingVoice,
  startRecording,
  stopRecording,
  saveCrmData,
  savingNotes,
  savedNotes,
  createdAt
}: any) {
  return (
    <div className="space-y-4 bg-crm-surface p-4 rounded-xl border border-crm-border shadow-sm">
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-crm-muted uppercase tracking-wider text-[13px]">General Notes</label>
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessingVoice}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                isRecording 
                  ? 'bg-status-cancelled text-white animate-pulse' 
                  : isProcessingVoice 
                  ? 'bg-crm-border text-crm-muted'
                  : 'bg-crm-primary/10 text-crm-primary hover:bg-crm-primary/20'
              }`}
            >
              {isRecording ? (
                <><span>🛑</span> Stop & Save</>
              ) : isProcessingVoice ? (
                <><span>⏳</span> Processing AI...</>
              ) : (
                <><span>🎤</span> Voice-to-CRM</>
              )}
            </button>
          </div>
          <textarea
            name="clientNotes"
            value={formData.clientNotes}
            onChange={handleChange}
            placeholder="General notes..."
            className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-2 text-[13px] text-crm-text placeholder-gray-600 focus:outline-none focus:border-brand-indigo resize-y"
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
            className="w-full bg-crm-surface border border-crm-border shadow-sm rounded-lg p-2 text-[13px] text-crm-text placeholder-gray-600 focus:outline-none focus:border-brand-indigo"
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
            className="w-full bg-crm-surface border border-status-cancelled/30 rounded-lg p-2 text-[13px] text-crm-text placeholder-gray-600 focus:outline-none focus:border-red-500"
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
        <p className="text-crm-muted text-[13px]">Member since {new Date(createdAt).toLocaleDateString()}</p>
        <button onClick={saveCrmData} disabled={savingNotes} className="bg-crm-primary text-white px-5 py-2 rounded-lg text-[13px] font-bold hover:bg-status-pending disabled:opacity-50 transition-colors">
          {savingNotes ? 'Saving...' : savedNotes ? '✓ Saved' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
