'use client';
import { useEffect, useState } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumInput from '@/components/ui/PremiumInput';

export default function BookingSettingsForm({ shopId }: { shopId: string }) {
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetch(`/api/shops/${shopId}/booking-settings`).then(r => r.json()).then(setSettings);
  }, [shopId]);

  const save = async () => {
    setSaving(true);
    const response = await fetch(`/api/shops/${shopId}/booking-settings`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
    });
    if (!response.ok) {
      setMsg('Failed to save settings. Please try again.');
      setSaving(false);
      return;
    }
    setMsg('Booking settings saved!');
    setSaving(false);
    setTimeout(() => setMsg(''), 5000);
  };

  const upd = (k: string, v: any) => setSettings((s: any) => ({ ...s, [k]: v }));

  if (!settings) return <div className="animate-pulse text-crm-muted py-4">Loading…</div>;

  return (
    <PremiumGlassCard className="space-y-8" accentColor="crm-primary">
      <h3 className="font-bold text-crm-text text-xl flex items-center gap-3">📅 Online Booking Settings</h3>
      {msg && <div className="p-3 bg-status-confirmed/20 border border-status-confirmed/30 text-status-confirmed rounded-lg text-[13px]">{msg}</div>}

      <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer group hover:bg-white/10 transition-colors">
        <div>
          <p className="font-bold text-crm-text text-[14px]">Enable Online Booking</p>
          <p className="text-crm-muted text-[13px]">Allow clients to book through your public portal</p>
        </div>
        <div className="relative flex items-center justify-center w-6 h-6">
          <input type="checkbox" checked={settings.onlineBookingEnabled} onChange={e => upd('onlineBookingEnabled', e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-white/20 rounded bg-black/30 checked:bg-crm-primary checked:border-crm-primary transition-all cursor-pointer" />
          <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
      </label>

      <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer group hover:bg-white/10 transition-colors">
        <div>
          <p className="font-bold text-crm-text text-[14px]">Auto-Confirm Bookings</p>
          <p className="text-crm-muted text-[13px]">Automatically confirm new bookings without manual approval</p>
        </div>
        <div className="relative flex items-center justify-center w-6 h-6">
          <input type="checkbox" checked={settings.autoConfirm} onChange={e => upd('autoConfirm', e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-white/20 rounded bg-black/30 checked:bg-crm-primary checked:border-crm-primary transition-all cursor-pointer" />
          <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <PremiumInput 
            label="Min Advance (hours)"
            type="number" min={0} max={72} value={settings.minAdvanceHours} onChange={e => upd('minAdvanceHours', +e.target.value)}
          />
          <p className="text-crm-muted mt-1 text-[11px] font-bold uppercase tracking-wider">Minimum hours before a booking</p>
        </div>
        <div>
          <PremiumInput 
            label="Max Advance (days)"
            type="number" min={1} max={365} value={settings.maxAdvanceDays} onChange={e => upd('maxAdvanceDays', +e.target.value)}
          />
          <p className="text-crm-muted mt-1 text-[11px] font-bold uppercase tracking-wider">How far ahead clients can book</p>
        </div>
        <div>
          <PremiumInput 
            label="Buffer Between Appts (mins)"
            type="number" min={0} max={60} step={5} value={settings.bufferBetweenAppointments} onChange={e => upd('bufferBetweenAppointments', +e.target.value)}
          />
          <p className="text-crm-muted mt-1 text-[11px] font-bold uppercase tracking-wider">Cleaning / prep time between bookings</p>
        </div>
      </div>

      <div className="md:w-1/2">
        <PremiumInput 
          label="Cancellation Window (hours)"
          type="number" min={0} max={168} value={settings.cancellationWindowHours} onChange={e => upd('cancellationWindowHours', +e.target.value)}
        />
        <p className="text-crm-muted mt-1 text-[11px] font-bold uppercase tracking-wider">Clients cannot cancel within this window</p>
      </div>

      <div>
        <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider mb-1.5">Cancellation Policy Text</label>
        <textarea rows={3} value={settings.cancellationPolicy} onChange={e => upd('cancellationPolicy', e.target.value)}
          placeholder="e.g. Cancellations must be made at least 24 hours in advance. Late cancellations may incur a fee."
          className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none placeholder:text-crm-muted/50 resize-none" />
        <p className="text-crm-muted mt-1 text-[11px] font-bold uppercase tracking-wider">Displayed on the booking portal and confirmation emails</p>
      </div>

      <div className="border-t border-white/10 pt-8 mt-8">
        <h4 className="font-bold text-crm-text text-lg mb-6 flex items-center gap-3">
          ⚡ Dynamic / Surge Pricing
          <span className="bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider">Pro</span>
        </h4>
        <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer group hover:bg-white/10 transition-colors mb-6">
          <div>
            <p className="font-bold text-crm-text text-[14px]">Enable Peak Hours Pricing</p>
            <p className="text-crm-muted text-[13px]">Automatically increase service prices during busy hours</p>
          </div>
          <div className="relative flex items-center justify-center w-6 h-6">
            <input type="checkbox" checked={settings.surgePricingEnabled} onChange={e => upd('surgePricingEnabled', e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-white/20 rounded bg-black/30 checked:bg-crm-primary checked:border-crm-primary transition-all cursor-pointer" />
            <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
        </label>
        
        {settings.surgePricingEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-black/20 border border-white/5 rounded-xl">
            <div className="space-y-1.5">
              <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Price Multiplier</label>
              <select value={settings.surgeMultiplier} onChange={e => upd('surgeMultiplier', parseFloat(e.target.value))} className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary outline-none appearance-none">
                <option value={1.1}>+10%</option>
                <option value={1.2}>+20%</option>
                <option value={1.25}>+25%</option>
                <option value={1.5}>+50%</option>
              </select>
            </div>
            <PremiumInput 
              label="Peak Start Time"
              type="time" value={settings.surgeStartHour} onChange={e => upd('surgeStartHour', e.target.value)} 
            />
            <PremiumInput 
              label="Peak End Time"
              type="time" value={settings.surgeEndHour} onChange={e => upd('surgeEndHour', e.target.value)} 
            />
          </div>
        )}
      </div>

      <div className="border-t border-white/10 pt-8 mt-8 mb-8">
        <h4 className="font-bold text-crm-text text-lg mb-6 flex items-center gap-3">
          🤖 AI Virtual Receptionist
          <span className="bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider">Pro</span>
        </h4>
        <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer group hover:bg-white/10 transition-colors mb-6">
          <div>
            <p className="font-bold text-crm-text text-[14px]">Enable SMS Auto-Replies</p>
            <p className="text-crm-muted text-[13px]">Use AI to answer client questions about hours, location, and services</p>
          </div>
          <div className="relative flex items-center justify-center w-6 h-6">
            <input type="checkbox" checked={settings.aiReceptionistEnabled} onChange={e => upd('aiReceptionistEnabled', e.target.checked)} className="peer appearance-none w-6 h-6 border-2 border-white/20 rounded bg-black/30 checked:bg-crm-primary checked:border-crm-primary transition-all cursor-pointer" />
            <svg className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
        </label>

        {settings.aiReceptionistEnabled && (
          <div className="p-6 bg-black/20 border border-white/5 rounded-xl space-y-6">
            <div>
              <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider mb-1.5">AI Persona / Prompt</label>
              <textarea rows={3} value={settings.aiReceptionistPrompt} onChange={e => upd('aiReceptionistPrompt', e.target.value)}
                placeholder="You are a helpful AI receptionist..."
                className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none placeholder:text-crm-muted/50 resize-none" />
              <p className="text-crm-muted mt-1 text-[11px] font-bold uppercase tracking-wider">Tell your AI how it should behave and talk to clients.</p>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5">
                <input type="checkbox" checked={settings.autoFillWaitlist} onChange={e => upd('autoFillWaitlist', e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-black/30 checked:bg-crm-primary checked:border-crm-primary transition-all cursor-pointer" />
                <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span className="font-bold text-crm-text text-[14px]">Auto-offer Waitlist spots when fully booked</span>
            </label>
          </div>
        )}
      </div>

      <PremiumButton onClick={save} disabled={saving} className="w-full">
        {saving ? 'Saving…' : 'Save Booking Settings'}
      </PremiumButton>
    </PremiumGlassCard>
  );
}

