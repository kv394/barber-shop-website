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
        <h1 className="font-serif font-bold text-botanical-accent mb-2 text-4xl md:text-5xl lg:text-6xl">User Management</h1>
        <p className="text-botanical-muted text-base md:text-lg">Manage all users across the platform. {users.length} user{users.length !== 1 ? 's' : ''} found.</p>
      </div>

      {/* Alerts */}
      {actionError && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-sm">
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="mb-4 p-3 bg-green-900/50 border border-green-500 text-green-200 rounded-lg text-sm">
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
            className="flex-1 bg-botanical-surface border border-botanical-border shadow-sm rounded-lg px-4 py-2.5 text-botanical-text text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-botanical-primary"
          />
          <button
            type="submit"
            className="bg-botanical-primary text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 transition-colors"
          >
            Search
          </button>
        </form>
        <div className="flex gap-1 overflow-x-auto">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => { setRoleFilter(role); setLoading(true); }}
              className={`px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition ${
                roleFilter === role
                  ? 'bg-botanical-primary text-white'
                  : 'bg-botanical-surface text-botanical-muted hover:bg-botanical-surface hover:text-botanical-text'
              }`}
            >
              {role.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-botanical-muted">Loading users...</div>
      ) : (
        <div className="bg-botanical-surface rounded-xl border border-botanical-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-botanical-muted text-left border-b border-botanical-border bg-botanical-surface">
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
                    SITE_ADMIN: 'bg-red-500/20 text-red-400 border-red-500/30',
                    SHOP_ADMIN: 'bg-botanical-primary/20 text-botanical-accent border-brand-gold/30',
                    STAFF: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                    CLIENT: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                    ATTENDANCE_KIOSK: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                  };

                  return (
                    <tr key={user.id} className="hover:bg-botanical-surface transition">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-botanical-text font-medium text-base md:text-lg">{user.name || '—'}</p>
                          <p className="text-botanical-muted text-base md:text-lg">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {editingUser === user.id ? (
                          <div className="flex gap-1 items-center">
                            <select
                              value={editRole}
                              onChange={e => setEditRole(e.target.value)}
                              className="bg-botanical-surface text-botanical-text text-xs rounded px-2 py-1 border border-botanical-border shadow-sm"
                            >
                              {ROLES.filter(r => r !== 'ALL').map(r => (
                                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleRoleChange(user.id, editRole)}
                              className="text-green-400 text-xs hover:underline"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="text-botanical-muted text-xs hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${roleColors[user.role] || 'bg-botanical-surface text-botanical-muted'}`}>
                            {user.role.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-botanical-muted text-xs">
                        {user.shopName || <span className="text-botanical-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-botanical-muted text-xs font-mono">
                        {user.phone || '—'}
                      </td>
                      <td className="px-4 py-3 text-botanical-muted text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingUser !== user.id && (
                          <button
                            onClick={() => { setEditingUser(user.id); setEditRole(user.role); setActionError(null); setActionSuccess(null); }}
                            className="text-botanical-accent text-xs hover:underline"
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
            <div className="text-center py-12 text-botanical-muted">
              No users found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

