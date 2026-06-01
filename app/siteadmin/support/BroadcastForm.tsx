'use client';

import { useRef, useState } from 'react';
import { sendBroadcast } from './actions';
import { useFormStatus } from 'react-dom';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`px-4 py-2 bg-[#ea580c] text-white rounded-lg font-medium text-[13px] hover:bg-[#c2410c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {pending ? 'Sending Broadcast...' : 'Send Broadcast'}
    </button>
  );
}

export default function BroadcastForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function action(data: FormData) {
    setSuccess(false);
    setError(null);
    const res = await sendBroadcast(data);
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(true);
      formRef.current?.reset();
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-white/40 shadow-sm shadow-brand-indigo/5 p-6">
      <h2 className="font-bold text-crm-text text-xl mb-2">📢 New Broadcast</h2>
      <p className="text-crm-muted text-[13px] mb-6">Send an announcement to all shops or specific user groups.</p>
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 text-[13px] rounded-lg border border-green-200">
          Broadcast sent successfully!
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 text-[13px] rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-crm-text mb-1">Target Audience</label>
          <select name="target" className="w-full px-3 py-2 bg-crm-surface border border-crm-border rounded-lg text-[13px] text-crm-text focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50">
            <option value="all">All Shops</option>
            <option value="premium">Premium Shops Only</option>
            <option value="free">Free Tier Shops Only</option>
            <option value="shop_admins">Shop Admins Only</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[13px] font-medium text-crm-text mb-1">Subject</label>
          <input 
            type="text" 
            name="title" 
            required 
            placeholder="e.g. Scheduled Maintenance Notice"
            className="w-full px-3 py-2 bg-crm-surface border border-crm-border rounded-lg text-[13px] text-crm-text focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50"
          />
        </div>
        
        <div>
          <label className="block text-[13px] font-medium text-crm-text mb-1">Message Content</label>
          <textarea 
            name="message" 
            required 
            rows={5}
            placeholder="Write your announcement here..."
            className="w-full px-3 py-2 bg-crm-surface border border-crm-border rounded-lg text-[13px] text-crm-text focus:outline-none focus:ring-2 focus:ring-[#ea580c]/50 resize-none"
          ></textarea>
        </div>
        
        <div className="flex justify-end pt-2">
          <SubmitButton />
        </div>
      </form>
    </div>
  );
}
