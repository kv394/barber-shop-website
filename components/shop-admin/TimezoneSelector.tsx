'use client';

import { useState } from 'react';
import { TIMEZONE_OPTIONS } from '@/lib/timezone';

export default function TimezoneSelector({
  shopId,
  currentTimezone,
}: {
  shopId: string;
  currentTimezone: string;
}) {
  const [timezone, setTimezone] = useState(currentTimezone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newTz = e.target.value;
    setTimezone(newTz);
    setSaving(true);
    setSaved(false);

    try {
      await fetch(`/api/shops/${shopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone: newTz }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // revert on error
      setTimezone(currentTimezone);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-8 bg-botanical-bg/70 border border-botanical-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">🌐</span>
        <div>
          <h3 className="text-lg font-bold text-botanical-text">Shop Timezone</h3>
          <p className="text-xs text-botanical-muted">All appointment times are displayed in this timezone.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <select
          value={timezone}
          onChange={handleChange}
          disabled={saving}
          style={{ colorScheme: 'dark' }}
          className="flex-1 max-w-md p-2.5 rounded-lg border border-slate-600 bg-botanical-surface text-botanical-text text-sm focus:ring-2 focus:ring-botanical-primary focus:outline-none transition-all disabled:opacity-50"
        >
          {TIMEZONE_OPTIONS.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label} — {tz.value}
            </option>
          ))}
        </select>
        {saving && <span className="text-xs text-botanical-muted animate-pulse">Saving…</span>}
        {saved && <span className="text-xs text-green-400">✓ Saved</span>}
      </div>
    </div>
  );
}

