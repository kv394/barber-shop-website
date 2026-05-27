'use client';

import { useState, useEffect } from 'react';

type UserRecord = {
 id: string;
 email: string;
 name: string | null;
 role: string;
 shopId: string | null;
 shopName: string | null;
 createdAt: string;
 phone: string | null;
};

const ROLES = ['ALL', 'SITE_ADMIN', 'SHOP_ADMIN', 'STAFF', 'CLIENT', 'ATTENDANCE_KIOSK'] as const;

export default function SiteAdminUsersPage() {
 const [users, setUsers] = useState<UserRecord[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState('');
 const [roleFilter, setRoleFilter] = useState('ALL');
 const [editingUser, setEditingUser] = useState<string | null>(null);
 const [editRole, setEditRole] = useState('');
 const [actionError, setActionError] = useState<string | null>(null);
 const [actionSuccess, setActionSuccess] = useState<string | null>(null);

 const fetchUsers = async () => {
 try {
 const params = new URLSearchParams();
 if (search) params.set('search', search);
 if (roleFilter !== 'ALL') params.set('role', roleFilter);
 const res = await fetch(`/api/siteadmin/users?${params}`);
 if (res.ok) {
 const data = await res.json();
 setUsers(data.users || []);
 }
 } catch {
 console.error('Failed to fetch users');
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchUsers();
 }, [roleFilter]);

 const handleSearch = (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 fetchUsers();
 };

 const handleRoleChange = async (userId: string, newRole: string) => {
 setActionError(null);
 setActionSuccess(null);
 try {
 const res = await fetch('/api/siteadmin/users', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ userId, role: newRole }),
 });
 if (res.ok) {
 setActionSuccess(`Role updated to ${newRole}`);
 setEditingUser(null);
 fetchUsers();
 } else {
 const data = await res.json();
 setActionError(data.error || 'Failed to update role');
 }
 } catch {
 setActionError('Network error');
 }
 };

 const filteredUsers = users;

 return (
 <div>
 <div className="mb-8">
 <h1 className="font-serif font-bold text-crm-accent mb-2 text-2xl font-bold">User Management</h1>
 <p className="text-crm-muted text-[13px]">Manage all users across the platform. {users.length} user{users.length !== 1 ? 's' : ''} found.</p>
 </div>

 {/* Alerts */}
 {actionError && (
 <div className="mb-4 p-3 bg-status-cancelled/20 border border-status-cancelled text-red-200 rounded-lg text-[13px]">
 {actionError}
 </div>
 )}
 {actionSuccess && (
 <div className="mb-4 p-3 bg-status-confirmed/20 border border-status-confirmed text-green-200 rounded-lg text-[13px]">
 {actionSuccess}
 </div>
 )}

 {/* Filters */}
 <div className="flex flex-col sm:flex-row gap-3 mb-6">
 <form onSubmit={handleSearch} className="flex-1 flex gap-2">
 <input
 type="text"
 value={search}
 onChange={e => setSearch(e.target.value)}
 placeholder="Search by name or email..."
 className="flex-1 bg-crm-surface border border-crm-border shadow-sm rounded-lg px-4 py-2.5 text-crm-text text-[13px] placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-crm-primary"
 />
 <button
 type="submit"
 className="bg-crm-primary text-white px-6 py-2.5 rounded-lg font-semibold text-[13px] hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors"
 >
 Search
 </button>
 </form>
 <div className="flex gap-1 overflow-x-auto">
 {ROLES.map(role => (
 <button
 key={role}
 onClick={() => { setRoleFilter(role); setLoading(true); }}
 className={`px-3 py-2 text-[11px] font-bold rounded-lg whitespace-nowrap transition ${
 roleFilter === role
 ? 'bg-crm-primary text-white'
 : 'bg-crm-surface text-crm-muted hover:bg-crm-surface hover:text-crm-text'
 }`}
 >
 {role.replace(/_/g, ' ')}
 </button>
 ))}
 </div>
 </div>

 {/* Users Table */}
 {loading ? (
 <div className="text-center py-12 text-crm-muted">Loading users...</div>
 ) : (
 <div className="bg-crm-surface rounded-xl border border-crm-border shadow-sm overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-[13px]">
 <thead>
 <tr className="text-crm-muted text-left border-b border-crm-border bg-crm-surface">
 <th className="px-4 py-3 font-medium">User</th>
 <th className="px-4 py-3 font-medium">Role</th>
 <th className="px-4 py-3 font-medium">Shop</th>
 <th className="px-4 py-3 font-medium">Phone</th>
 <th className="px-4 py-3 font-medium">Joined</th>
 <th className="px-4 py-3 font-medium text-right">Actions</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/5">
 {filteredUsers.map(user => {
 const roleColors: Record<string, string> = {
 SITE_ADMIN: 'bg-status-cancelled/20 text-status-cancelled border-status-cancelled/30',
 SHOP_ADMIN: 'bg-crm-primary/20 text-crm-accent border-brand-gold/30',
 STAFF: 'bg-crm-accent/20 text-crm-accent border-crm-accent/30',
 CLIENT: 'bg-status-info/20 text-status-info border-status-info/30',
 ATTENDANCE_KIOSK: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
 };

 return (
 <tr key={user.id} className="hover:bg-crm-surface transition">
 <td className="px-4 py-3">
 <div>
 <p className="text-crm-text font-medium text-[13px]">{user.name || '—'}</p>
 <p className="text-crm-muted text-[13px]">{user.email}</p>
 </div>
 </td>
 <td className="px-4 py-3">
 {editingUser === user.id ? (
 <div className="flex gap-1 items-center">
 <select
 value={editRole}
 onChange={e => setEditRole(e.target.value)}
 className="bg-crm-surface text-crm-text text-[11px] rounded px-2 py-1 border border-crm-border shadow-sm"
 >
 {ROLES.filter(r => r !== 'ALL').map(r => (
 <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
 ))}
 </select>
 <button
 onClick={() => handleRoleChange(user.id, editRole)}
 className="text-status-confirmed text-[11px] hover:underline"
 >
 Save
 </button>
 <button
 onClick={() => setEditingUser(null)}
 className="text-crm-muted text-[11px] hover:underline"
 >
 Cancel
 </button>
 </div>
 ) : (
 <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${roleColors[user.role] || 'bg-crm-surface text-crm-muted'}`}>
 {user.role.replace(/_/g, ' ')}
 </span>
 )}
 </td>
 <td className="px-4 py-3 text-crm-muted text-[11px]">
 {user.shopName || <span className="text-crm-muted">—</span>}
 </td>
 <td className="px-4 py-3 text-crm-muted text-[11px] font-mono">
 {user.phone || '—'}
 </td>
 <td className="px-4 py-3 text-crm-muted text-[11px]">
 {new Date(user.createdAt).toLocaleDateString()}
 </td>
 <td className="px-4 py-3 text-right">
 {editingUser !== user.id && (
 <button
 onClick={() => { setEditingUser(user.id); setEditRole(user.role); setActionError(null); setActionSuccess(null); }}
 className="text-crm-accent text-[11px] hover:underline"
 >
 Change Role
 </button>
 )}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 {filteredUsers.length === 0 && (
 <div className="text-center py-12 text-crm-muted">
 No users found matching your criteria.
 </div>
 )}
 </div>
 )}
 </div>
 );
}

