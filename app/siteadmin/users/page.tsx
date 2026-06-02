'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  Plus, 
  X, 
  AlertCircle, 
  CheckCircle2,
  MoreVertical,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

type UserRecord = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  shopId: string | null;
  shopName: string | null;
  website: string | null;
  createdAt: string;
  phone: string | null;
  isBlocked?: boolean;
};

const ROLES = ['ALL', 'SITE_ADMIN', 'SHOP_ADMIN', 'STAFF', 'CLIENT', 'ATTENDANCE_KIOSK'] as const;

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<'ADMINS' | 'ALL'>('ADMINS');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters for All Users Tab
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Alerts
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserRecord | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab === 'ADMINS') {
        params.set('role', 'SITE_ADMIN');
      } else {
        if (search) params.set('search', search);
        if (roleFilter !== 'ALL') params.set('role', roleFilter);
      }
      
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, roleFilter]);

  // Alert cleanup
  useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'ALL') {
      fetchUsers();
    }
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
        setActionSuccess(`User role successfully updated to ${newRole}`);
        setIsAddAdminModalOpen(false);
        setSearchedUser(null);
        setSearchEmail('');
        fetchUsers();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to update role');
      }
    } catch {
      setActionError('Network error occurred while updating user');
    }
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setEditName(user.name || '');
    setEditEmail(user.email);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsEditing(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/siteadmin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail }),
      });
      if (res.ok) {
        setActionSuccess(`User profile updated successfully`);
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to update user');
      }
    } catch {
      setActionError('Network error occurred while updating user');
    } finally {
      setIsEditing(false);
    }
  };

  const handlePasswordReset = async (userId: string) => {
    if (!confirm('Send a password reset email to this user?')) return;
    try {
      const res = await fetch(`/api/siteadmin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password' }),
      });
      if (res.ok) {
        setActionSuccess('Password reset email sent');
      } else {
        const data = await res.json();
        setActionError(data.error || 'Failed to send reset email');
      }
    } catch {
      setActionError('Network error');
    }
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      const res = await fetch(`/api/siteadmin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setActionSuccess(`User ${action}ed successfully`);
        fetchUsers();
      } else {
        const data = await res.json();
        setActionError(data.error || `Failed to ${action} user`);
      }
    } catch {
      setActionError('Network error');
    }
  };

  const handleSearchEmailForAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    
    setIsSearchingUser(true);
    setSearchedUser(null);
    setActionError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('search', searchEmail);
      const res = await fetch(`/api/siteadmin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        const exactMatch = data.users.find((u: UserRecord) => u.email.toLowerCase() === searchEmail.toLowerCase());
        if (exactMatch) {
          setSearchedUser(exactMatch);
        } else {
          setActionError('No user found with that exact email address.');
        }
      }
    } catch {
      setActionError('Failed to search for user');
    } finally {
      setIsSearchingUser(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SITE_ADMIN': return 'bg-status-cancelled/10 text-status-cancelled border-status-cancelled/20';
      case 'SHOP_ADMIN': return 'bg-crm-primary/10 text-crm-accent border-crm-primary/20';
      case 'STAFF': return 'bg-crm-accent/10 text-crm-accent border-crm-accent/20';
      case 'CLIENT': return 'bg-status-info/10 text-status-info border-status-info/20';
      case 'ATTENDANCE_KIOSK': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-crm-text mb-2 flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-crm-primary" />
            Admin Security
          </h1>
          <p className="text-crm-muted text-sm max-w-2xl">
            Manage platform-wide security and administration. Control which users have elevated 
            Site Admin privileges to access system-level configurations.
          </p>
        </div>
        {activeTab === 'ADMINS' && (
          <button
            onClick={() => setIsAddAdminModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-crm-primary hover:bg-crm-accent text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Site Admin
          </button>
        )}
      </div>

      {/* Global Alerts */}
      {actionError && !isAddAdminModalOpen && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{actionError}</p>
        </div>
      )}
      {actionSuccess && !isAddAdminModalOpen && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700 font-medium">{actionSuccess}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-crm-border mb-6">
        <button
          onClick={() => setActiveTab('ADMINS')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ADMINS' 
              ? 'border-crm-primary text-crm-primary' 
              : 'border-transparent text-crm-muted hover:text-crm-text hover:border-gray-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Site Admins
        </button>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'ALL' 
              ? 'border-crm-primary text-crm-primary' 
              : 'border-transparent text-crm-muted hover:text-crm-text hover:border-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          All Platform Users
        </button>
      </div>

      {/* Tab Content: All Users Filter */}
      {activeTab === 'ALL' && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-4 rounded-xl shadow-sm border border-crm-border">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-crm-primary/20 focus:border-crm-primary transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Search
            </button>
          </form>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                  roleFilter === role
                    ? 'bg-crm-text text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-crm-border overflow-hidden">
        {/* Table Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">
            {loading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-crm-primary/20 border-t-crm-primary rounded-full animate-spin mb-4"></div>
            <p className="text-crm-muted text-sm font-medium">Loading security records...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-24 px-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">No users found</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              {activeTab === 'ADMINS' 
                ? "There are currently no users with Site Admin privileges." 
                : "No users match your current search and filter criteria."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map(user => (
              <div key={user.id} className="px-6 py-4 hover:bg-gray-50/80 transition-all duration-150 group">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-crm-primary/20 to-crm-primary/5 flex items-center justify-center text-crm-primary font-bold text-sm flex-shrink-0 border border-crm-primary/10">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>

                  {/* User Info - Name, Email, Shop */}
                  <div className="min-w-0 w-[280px] lg:w-[340px] flex-shrink">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">
                        {user.name || 'Unknown User'}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace(/_/g, ' ')}
                      </span>
                      {user.isBlocked && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                          BLOCKED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.shopName && user.role !== 'SITE_ADMIN' && (
                        <span className="text-xs text-gray-400 truncate max-w-[140px] hidden sm:inline" title={user.shopName}>
                          • {user.shopName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Website */}
                  <div className="hidden md:flex items-center w-[200px] flex-shrink-0">
                    {user.website ? (
                      <a 
                        href={user.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1.5 text-xs text-crm-primary hover:text-crm-accent transition-colors group/link max-w-[200px]"
                        title={user.website}
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0 opacity-60 group-hover/link:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span className="truncate group-hover/link:underline">
                          {user.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </span>
                      </a>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>

                  {/* Joined Date */}
                  <div className="hidden lg:block text-xs text-gray-500 w-[100px] flex-shrink-0 text-right tabular-nums">
                    {new Date(user.createdAt).toLocaleDateString(undefined, { 
                      year: 'numeric', month: 'short', day: 'numeric' 
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button 
                      onClick={() => openEditModal(user)} 
                      className="p-2 rounded-lg text-gray-400 hover:text-crm-primary hover:bg-crm-primary/5 transition-colors" 
                      title="Edit user"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handlePasswordReset(user.id)} 
                      className="p-2 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" 
                      title="Reset password"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleToggleBlock(user.id, !!user.isBlocked)} 
                      className={`p-2 rounded-lg transition-colors ${user.isBlocked ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                      title={user.isBlocked ? 'Unblock user' : 'Block user'}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {user.isBlocked ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        )}
                      </svg>
                    </button>
                    {activeTab === 'ADMINS' ? (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to revoke SITE_ADMIN privileges from ${user.email}?`)) {
                            handleRoleChange(user.id, 'CLIENT');
                          }
                        }}
                        className="ml-1 text-[11px] font-semibold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 px-3 py-1.5 rounded-lg transition-all duration-150"
                      >
                        Revoke
                      </button>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="ml-1 text-[11px] font-medium border border-gray-200 rounded-lg py-1.5 pl-2 pr-5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-crm-primary/20 hover:border-gray-300 transition-colors cursor-pointer"
                      >
                        {ROLES.filter(r => r !== 'ALL').map(r => (
                          <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      {isAddAdminModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ShieldPlusIcon className="w-5 h-5 text-crm-primary" />
                Grant Admin Privileges
              </h2>
              <button 
                onClick={() => {
                  setIsAddAdminModalOpen(false);
                  setSearchedUser(null);
                  setSearchEmail('');
                  setActionError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Search for an existing user by their email address to upgrade their account to a Site Administrator.
              </p>
              
              <form onSubmit={handleSearchEmailForAdmin} className="flex gap-2 mb-6">
                <input
                  type="email"
                  required
                  value={searchEmail}
                  onChange={e => setSearchEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-crm-primary/20 focus:border-crm-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={isSearchingUser}
                  className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSearchingUser ? 'Searching...' : 'Search'}
                </button>
              </form>

              {actionError && isAddAdminModalOpen && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {actionError}
                </div>
              )}

              {searchedUser && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-crm-primary/10 flex items-center justify-center text-crm-primary font-bold">
                      {(searchedUser.name || searchedUser.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{searchedUser.name || 'Unknown Name'}</p>
                      <p className="text-sm text-gray-500">{searchedUser.email}</p>
                    </div>
                  </div>
                  
                  {searchedUser.role === 'SITE_ADMIN' ? (
                    <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg font-medium">
                      This user is already a Site Administrator.
                    </p>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(searchedUser.id, 'SITE_ADMIN')}
                      className="w-full flex items-center justify-center gap-2 bg-crm-primary hover:bg-crm-accent text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <UserCheck className="w-4 h-4" />
                      Confirm & Grant Access
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-crm-primary" />
                Edit User Profile
              </h2>
              <button 
                onClick={() => {
                  setEditingUser(null);
                  setActionError(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditUserSubmit} className="p-6">
              {actionError && editingUser && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {actionError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-crm-primary/20 focus:border-crm-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-crm-primary/20 focus:border-crm-primary transition-all"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditing}
                  className="bg-crm-primary hover:bg-crm-accent text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isEditing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Minimal icon helper for the modal header to avoid importing too many unique ones
function ShieldPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </svg>
  );
}
