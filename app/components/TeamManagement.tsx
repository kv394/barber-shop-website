'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserQRCode from '@/components/UserQRCode';

interface ShopUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  canManageInventory: boolean;
  barcode: string | null;
  createdAt: string;
}

interface TeamManagementProps {
  shopId: string;
  currentUserRole: 'SUPER_ADMIN' | 'SHOP_ADMIN' | 'STAFF' | 'CLIENT';
}

const roleConfig: Record<string, { emoji: string; bgClass: string; textClass: string }> = {
  SHOP_ADMIN: { emoji: '👑', bgClass: 'bg-brand-gold/20', textClass: 'text-brand-gold' },
  STAFF: { emoji: '🛠️', bgClass: 'bg-purple-500/20', textClass: 'text-purple-400' },
  CLIENT: { emoji: '👤', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400' },
};

export function TeamManagement({ shopId, currentUserRole }: TeamManagementProps) {
  const [users, setUsers] = useState<ShopUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'SHOP_ADMIN' | 'STAFF' | 'CLIENT'>(
    currentUserRole === 'SUPER_ADMIN' ? 'SHOP_ADMIN' : 'STAFF'
  );
  const [canManageInventory, setCanManageInventory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewQrCodeUser, setViewQrCodeUser] = useState<ShopUser | null>(null);
  const [isEditingKiosk, setIsEditingKiosk] = useState(false);
  const [editKioskEmail, setEditKioskEmail] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/shops/${shopId}/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [shopId]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/shops/${shopId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          role: newRole,
          canManageInventory: newRole === 'STAFF' ? canManageInventory : false,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add user');
      }
      const newUser = await response.json();
      setUsers(currentUsers => [...currentUsers.filter(u => u.email !== newUser.email), newUser]);
      setNewEmail('');
      setCanManageInventory(false);
      setSuccessMessage(`${newEmail} has been added as ${newRole}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this user from the shop?')) return;
    try {
      const response = await fetch(`/api/shops/${shopId}/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove user');
      }
      setUsers(users.filter((u) => u.id !== userId));
      setSuccessMessage('User removed from shop');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleUpdateKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editKioskEmail || !window.confirm(`Are you sure you want to change the Kiosk Email to ${editKioskEmail}?`)) return;

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`/api/shops/${shopId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: editKioskEmail,
          role: 'ATTENDANCE_KIOSK',
          canManageInventory: false,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update kiosk email');
      }
      const newKioskUser = await response.json();
      setUsers(currentUsers => currentUsers.map(u => u.role === 'ATTENDANCE_KIOSK' ? newKioskUser : u));
      setSuccessMessage(`Kiosk email has been updated to ${editKioskEmail}`);
      setIsEditingKiosk(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3 animate-pulse">⏳</div>
        <p className="text-gray-400 text-sm font-medium">Loading team members…</p>
      </div>
    );
  }

  const kioskUser = users.find(u => u.role === 'ATTENDANCE_KIOSK');
  const regularUsers = users.filter(u => u.role !== 'ATTENDANCE_KIOSK');
  const shopAdminExists = users.some(u => u.role === 'SHOP_ADMIN');
  const canAddShopAdmin = currentUserRole === 'SUPER_ADMIN' && !shopAdminExists;

  return (
    <div className="w-full space-y-6">

      {/* ═══ Alerts ═══ */}
      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <span className="text-lg">❌</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400 transition-colors">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl text-sm">
          <span className="text-lg">✅</span>
          <span>{successMessage}</span>
        </div>
      )}

      {/* ═══ Kiosk Setup ═══ */}
      {kioskUser && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-blue-500/20 shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-500/60 to-transparent" />
          <div className="p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl">📱</div>
                <div>
                  <h3 className="text-base font-bold text-white">Tablet Kiosk Setup</h3>
                  <p className="text-xs text-gray-500">Front desk attendance device</p>
                </div>
              </div>
              {currentUserRole === 'SUPER_ADMIN' && (
                <button 
                  onClick={() => {
                    setIsEditingKiosk(!isEditingKiosk);
                    setEditKioskEmail(kioskUser.email);
                  }}
                  className="text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all font-semibold"
                >
                  {isEditingKiosk ? 'Cancel' : 'Edit Email'}
                </button>
              )}
            </div>
            
            {isEditingKiosk ? (
              <form onSubmit={handleUpdateKiosk} className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                   <div className="w-full sm:flex-1">
                      <label className="block text-[10px] text-gray-400 mb-1 font-semibold uppercase tracking-wider">New Kiosk Email</label>
                      <input type="email" value={editKioskEmail} onChange={(e) => setEditKioskEmail(e.target.value)}
                        placeholder="new-kiosk@example.com" required
                        className="w-full p-2 rounded-lg border border-blue-500/30 bg-slate-900/80 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" />
                   </div>
                   <button type="submit" disabled={isSubmitting}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg transition-all shadow-lg text-sm disabled:opacity-50">
                      {isSubmitting ? 'Saving…' : 'Save'}
                   </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-sm text-gray-300 mb-3">Sign up on the tablet device using this exact email:</p>
                <div className="bg-slate-800/80 p-3 rounded-xl border border-white/10 text-center mb-3">
                  <code className="text-brand-gold font-mono text-sm font-bold">{kioskUser.email}</code>
                </div>
                <p className="text-[11px] text-blue-400/70">Once an account is created with this email, it will inherit kiosk privileges automatically.</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ Invite Form ═══ */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-gold via-brand-gold/60 to-transparent" />
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-gold/20 flex items-center justify-center text-xl">✉️</div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {currentUserRole === 'SUPER_ADMIN' ? 'Assign Shop Admin' : 'Invite Team Members'}
              </h3>
              <p className="text-xs text-gray-500">Add new members to your shop</p>
            </div>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-5">
                <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">📧 Email</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@example.com" required
                  className="w-full p-2.5 rounded-lg border border-slate-600 bg-slate-800/80 text-white text-sm placeholder-gray-600 focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all" />
              </div>
              <div className="md:col-span-4">
                <label className="block text-[10px] text-gray-500 mb-1 font-semibold uppercase tracking-wider">👤 Role</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as 'SHOP_ADMIN' | 'STAFF' | 'CLIENT')}
                  style={{ colorScheme: 'dark' }}
                  className="w-full p-2.5 rounded-lg border border-slate-600 bg-slate-800/80 text-white text-sm focus:ring-2 focus:ring-brand-gold focus:outline-none transition-all">
                  {currentUserRole === 'SUPER_ADMIN' && canAddShopAdmin && <option value="SHOP_ADMIN">Shop Admin</option>}
                  {currentUserRole === 'SHOP_ADMIN' && (
                    <>
                      <option value="STAFF">Staff Member</option>
                      <option value="CLIENT">Client</option>
                    </>
                  )}
                </select>
              </div>
              <div className="md:col-span-3">
                <button type="submit"
                  disabled={isSubmitting || !newEmail || (currentUserRole === 'SUPER_ADMIN' && !canAddShopAdmin)}
                  className="w-full bg-brand-gold text-brand-dark font-bold py-2.5 rounded-xl hover:bg-white hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-lg shadow-brand-gold/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                  {isSubmitting ? '⏳ Adding…' : '✉️ Invite'}
                </button>
              </div>
            </div>

            {currentUserRole === 'SUPER_ADMIN' && shopAdminExists && (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-900/20 px-4 py-2.5 rounded-xl border border-amber-500/20">
                <span>⚠️</span>
                <span>A Shop Admin has already been assigned. Remove them below to assign a new one.</span>
              </div>
            )}

            {newRole === 'STAFF' && (
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-800/50 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                <input type="checkbox" checked={canManageInventory} onChange={(e) => setCanManageInventory(e.target.checked)} className="sr-only peer" />
                <div className="w-9 h-5 bg-slate-600 rounded-full peer peer-checked:bg-brand-gold transition-colors duration-200
                  after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 peer-checked:after:translate-x-full relative" />
                <div>
                  <span className="text-sm text-white font-medium">📦 Inventory Access</span>
                  <p className="text-[11px] text-gray-500">Allow this staff member to update inventory counts</p>
                </div>
              </label>
            )}
          </form>
        </div>
      </div>

      {/* ═══ Team Members List ═══ */}
      <div>
        {regularUsers.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              👥 {regularUsers.length} Team Member{regularUsers.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {regularUsers.length === 0 ? (
          <div className="text-center py-12 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-dashed border-white/10">
            <div className="text-5xl mb-3">👥</div>
            <p className="text-base text-gray-400 font-semibold">No team members yet</p>
            <p className="text-sm text-gray-600 mt-1">Invite your first team member above to get started</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {regularUsers.map((user) => {
              const rc = roleConfig[user.role] || { emoji: '👤', bgClass: 'bg-white/10', textClass: 'text-gray-300' };

              return (
                <div key={user.id}
                  className="group bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-4 border border-white/5 hover:border-white/15 transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Avatar + Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${rc.bgClass} flex items-center justify-center text-lg font-bold ${rc.textClass} border border-white/5 shrink-0`}>
                        {(user.name || user.email)?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-white text-sm truncate">{user.name || user.email.split('@')[0]}</h4>
                          <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full ${rc.bgClass} ${rc.textClass} shrink-0`}>
                            {rc.emoji} {user.role.replace('_', ' ')}
                          </span>
                          {user.role === 'STAFF' && user.canManageInventory && (
                            <span className="text-[9px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">📦 Inventory</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-[52px] sm:ml-0">
                      {user.barcode && (
                        <button onClick={() => setViewQrCodeUser(user)}
                          className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-gold/40 text-gray-300 hover:text-brand-gold px-2.5 py-1 rounded-lg font-semibold transition-all duration-200">
                          🔲 QR
                        </button>
                      )}

                      {user.role === 'STAFF' && (
                        <Link href={`/shop/${shopId}/settings/team/${user.id}/schedule`}
                          className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-400/40 text-gray-300 hover:text-blue-400 px-2.5 py-1 rounded-lg font-semibold transition-all duration-200">
                          📋 Schedule
                        </Link>
                      )}

                      <button onClick={() => handleRemoveUser(user.id)}
                        className="sm:opacity-0 sm:group-hover:opacity-100 bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded-lg transition-all duration-200"
                        title="Remove user">
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ QR Code Modal ═══ */}
      {viewQrCodeUser && viewQrCodeUser.barcode && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-brand-gold/30 shadow-2xl relative flex flex-col items-center overflow-hidden max-w-sm w-full">
            <div className="h-1 w-full bg-gradient-to-r from-brand-gold via-brand-gold/60 to-transparent" />
            <button onClick={() => setViewQrCodeUser(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl w-8 h-8 flex items-center justify-center transition-all duration-200 border border-white/10">
              ✕
            </button>
            <div className="p-8 flex flex-col items-center">
              <div className="w-14 h-14 rounded-xl bg-brand-gold/20 flex items-center justify-center text-2xl mb-4 border border-brand-gold/20">
                🪪
              </div>
              <h3 className="text-lg font-bold text-white mb-1">ID Card</h3>
              <p className="text-xs text-gray-500 mb-6">{viewQrCodeUser.name || viewQrCodeUser.email.split('@')[0]}</p>
              <UserQRCode barcode={viewQrCodeUser.barcode} userName={viewQrCodeUser.name || viewQrCodeUser.email.split('@')[0]} />
              <p className="text-[11px] text-gray-500 mt-6 text-center max-w-xs leading-relaxed">
                This QR code uniquely identifies this member. They can present it for quick sign-in or action authorization.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
