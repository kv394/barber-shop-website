'use client';;
import Image from 'next/image';

import { useState } from 'react';

export default function AssignShopAdminModal({
  shopId,
  shopName,
  onClose,
  onSuccess
}: {
  shopId: string;
  shopName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('SHOP_ADMIN');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/siteadmin/shops/${shopId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const err = await res.json();
        alert('Failed to assign user: ' + err.error);
      }
    } catch (error) {
      alert('Error assigning user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-crm-darkBase/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-crm-surface w-full max-w-md rounded-2xl border border-crm-border shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-4 text-crm-primary bg-crm-surface hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">✕</button>
        <h2 className="font-bold text-crm-primary mb-2 text-xl">Assign Shop Team</h2>
        <p className="text-crm-muted mb-6 text-[13px]">Assign a user to <strong>{shopName}</strong></p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block font-bold text-crm-muted mb-2 uppercase tracking-wider text-[13px]">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full bg-crm-bg border border-crm-border rounded-lg p-3 text-[13px] text-crm-text focus:ring-2 focus:ring-crm-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-crm-muted mb-2 uppercase tracking-wider text-[13px]">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-crm-bg border border-crm-border rounded-lg p-3 text-[13px] text-crm-text focus:ring-2 focus:ring-crm-primary focus:outline-none"
            >
              <option value="SHOP_ADMIN">Shop Admin</option>
              <option value="ATTENDANCE_KIOSK">Attendance Kiosk</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-crm-border">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg text-[13px] font-semibold text-crm-muted hover:bg-crm-bg hover:text-crm-text transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !email}
              className="bg-crm-primary text-white px-6 py-2 rounded-lg text-[13px] font-bold hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition disabled:opacity-50"
            >
              {saving ? 'Assigning...' : 'Assign User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
