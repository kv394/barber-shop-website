"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProductManager({ shopId, products }: { shopId: string, products: any[] }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '', price: '', inventoryCount: '0', 
    reorderPoint: '0', trackInventory: false, 
    type: 'RETAIL', sku: '', barcode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          inventoryCount: parseInt(formData.inventoryCount),
          reorderPoint: parseInt(formData.reorderPoint)
        }),
      });

      if (!res.ok) throw new Error('Failed to create product');

      setIsAdding(false);
      setFormData({ name: '', price: '', inventoryCount: '0', reorderPoint: '0', trackInventory: false, type: 'RETAIL', sku: '', barcode: '' });
      setSuccessMessage('Product created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      router.refresh();
    } catch (error) {
      console.error(error);
      setError('Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/shops/${shopId}/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      router.refresh();
    } catch (error) {
      console.error(error);
      setError('Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Products & Inventory</h2>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-brand-gold text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
          {isAdding ? 'Cancel' : 'Add Product'}
        </button>
      </div>

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

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg border border-white/10 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Name *</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Price ($) *</label>
              <input required type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'RETAIL' | 'BACKBAR' })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white">
                <option value="RETAIL">Retail</option>
                <option value="BACKBAR">Backbar (Shop Use)</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input type="checkbox" id="trackInventory" checked={formData.trackInventory} onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })} className="rounded border-white/10 bg-slate-900 text-brand-gold focus:ring-brand-gold" />
              <label htmlFor="trackInventory" className="text-sm font-medium text-gray-400">Track Inventory</label>
            </div>
            
            {formData.trackInventory && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Current Stock</label>
                  <input type="number" min="0" value={formData.inventoryCount} onChange={(e) => setFormData({ ...formData, inventoryCount: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Low Stock Alert (Reorder Point)</label>
                  <input type="number" min="0" value={formData.reorderPoint} onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">SKU (Optional)</label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Barcode (Optional)</label>
              <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSubmitting} className="bg-brand-gold text-slate-900 px-6 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Product'}
            </button>
          </div>
        </form>
      )}

      {/* Mobile card layout */}
      <div className="sm:hidden space-y-3">
        {products.map((product) => (
          <div key={product.id} className="bg-slate-800/50 rounded-xl p-4 border border-white/10 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-white">{product.name}</h3>
                <p className="text-brand-gold font-bold mt-1">${product.price.toFixed(2)}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.type === 'RETAIL' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                {product.type}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <div className="text-sm">
                {product.trackInventory ? (
                  <span className={product.inventoryCount <= product.reorderPoint ? 'text-red-400 font-bold' : 'text-green-400'}>
                    {product.inventoryCount} in stock
                  </span>
                ) : (
                  <span className="text-gray-500">Not tracked</span>
                )}
              </div>
              <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300 text-sm transition-colors">
                Delete
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-slate-800/50 rounded-xl border border-white/10">
            No products found. Add your first product to manage inventory!
          </div>
        )}
      </div>

      {/* Desktop table layout */}
      <div className="hidden sm:block bg-slate-800 rounded-lg border border-white/10 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-slate-900/50 text-xs uppercase text-gray-500 border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium text-white">{product.name}</td>
                <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.type === 'RETAIL' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {product.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {product.trackInventory ? (
                    <span className={product.inventoryCount <= product.reorderPoint ? 'text-red-400 font-bold' : 'text-green-400'}>
                      {product.inventoryCount} in stock
                    </span>
                  ) : (
                    <span className="text-gray-500">Not tracked</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300 transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No products found. Add your first product to manage inventory!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

