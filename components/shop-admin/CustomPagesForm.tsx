'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CustomPagesForm({ shopId, customization }: { shopId: string; customization: any }) {
  const [pages, setPages] = useState<any[]>(customization?.pages || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/shops/${shopId}/customization`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customization: { ...customization, pages } }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save pages (${response.status})`);
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addPage = () => {
    const newId = `page-${Date.now()}`;
    setPages([...pages, { id: newId, title: 'New Page', content: '', isVisible: true }]);
  };

  const updatePage = (index: number, field: string, value: any) => {
    const updated = [...pages];
    updated[index][field] = value;
    setPages(updated);
    setSuccess(false);
  };

  const removePage = (index: number) => {
    const updated = [...pages];
    updated.splice(index, 1);
    setPages(updated);
    setSuccess(false);
  };

  return (
    <div className="w-full mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-botanical-text">Custom Pages (Menus)</h2>
        <button
          onClick={addPage}
          className="bg-botanical-primary text-white px-4 py-2 rounded font-bold hover:bg-botanical-primary transition-colors"
        >
          + Add Page
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-400 p-4 rounded-lg mb-6 text-sm">
          Pages saved successfully!
        </div>
      )}

      {pages.length === 0 ? (
        <div className="text-botanical-muted bg-botanical-surface p-6 rounded-lg text-center">
          No custom pages found. Create one to add to your shop portal menu.
        </div>
      ) : (
        <div className="space-y-6">
          {pages.map((page, index) => (
            <div key={page.id} className="bg-botanical-surface p-6 rounded-lg border-2 border-b-[6px] border-botanical-border">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-botanical-text">Page {index + 1}</h3>
                <button
                  onClick={() => removePage(index)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-botanical-muted mb-1">Title (Menu Label)</label>
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => updatePage(index, 'title', e.target.value)}
                    className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-3 py-2 text-botanical-text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-botanical-muted mb-1">URL Slug / ID</label>
                  <input
                    type="text"
                    value={page.id}
                    onChange={(e) => updatePage(index, 'id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-3 py-2 text-botanical-text"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-botanical-muted mb-1">Content</label>
                <textarea
                  value={page.content}
                  onChange={(e) => updatePage(index, 'content', e.target.value)}
                  rows={6}
                  className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-3 py-2 text-botanical-text"
                  placeholder="Enter HTML or plain text here..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`visible-${page.id}`}
                  checked={page.isVisible}
                  onChange={(e) => updatePage(index, 'isVisible', e.target.checked)}
                  className="w-4 h-4 rounded border-botanical-border text-botanical-accent focus:ring-botanical-primary bg-botanical-bg"
                />
                <label htmlFor={`visible-${page.id}`} className="text-sm text-botanical-muted">
                  Visible in public menu
                </label>
              </div>
            </div>
          ))}
          
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-botanical-primary text-white hover:bg-white hover:text-botanical-primary border border-transparent hover:border-botanical-primary/30 disabled:opacity-50 font-bold py-3 rounded-lg transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Pages'}
          </button>
        </div>
      )}
    </div>
  );
}
