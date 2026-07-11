'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Dependent {
  id: string;
  name: string;
}

export default function FamilyPage() {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchFamily();
  }, []);

  async function fetchFamily() {
    try {
      const res = await fetch('/api/my-appointments/family');
      if (!res.ok) throw new Error('Failed to load family members');
      const data = await res.json();
      setDependents(data.dependents || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDependent(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/my-appointments/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add dependent');
      }

      setNewName('');
      setIsAdding(false);
      await fetchFamily();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <p className="text-crm-muted font-medium text-[13px]">Loading Family...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <div className="bg-crm-surface border border-crm-border rounded-xl shadow-sm overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-crm-text">My Family</h2>
            <p className="text-crm-muted text-[13px] mt-1">Manage your dependents for class enrollments.</p>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="bg-crm-primary text-white font-bold px-4 py-2 rounded-lg text-[13px] hover:opacity-90 transition-opacity"
            >
              + Add Member
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-lg text-[13px]">
            {error}
          </div>
        )}

        {isAdding && (
          <form onSubmit={handleAddDependent} className="mb-8 bg-crm-bg border border-crm-border p-4 rounded-lg">
            <h3 className="font-bold text-crm-text mb-4 text-[14px]">New Family Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-crm-muted mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-crm-surface border border-crm-border rounded px-3 py-2 text-[13px] text-crm-text focus:outline-none focus:border-crm-primary"
                  placeholder="e.g. Jane Doe"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !newName.trim()}
                  className="bg-crm-primary text-white font-bold px-4 py-2 rounded text-[13px] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewName('');
                  }}
                  className="bg-crm-bg border border-crm-border text-crm-text font-bold px-4 py-2 rounded text-[13px] hover:bg-crm-surface transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {dependents.length === 0 ? (
          <div className="text-center py-12 bg-crm-bg border border-crm-border border-dashed rounded-xl">
            <p className="text-crm-muted text-[13px]">You haven't added any family members yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dependents.map(dep => (
              <div key={dep.id} className="bg-crm-bg border border-crm-border p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-crm-surface rounded-full flex items-center justify-center font-bold text-crm-primary border border-crm-border">
                    {dep.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-crm-text text-[14px]">{dep.name}</h4>
                    <p className="text-crm-muted text-[12px]">Dependent</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
