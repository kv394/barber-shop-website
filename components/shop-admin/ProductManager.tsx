"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductInventoryManager from './ProductInventoryManager';
import ProductBarcodeScannerWrapper from '@/components/checkout/ProductBarcodeScannerWrapper';
import { QRCodeSVG } from 'qrcode.react';

export default function ProductManager({ shopId, products }: { shopId: string, products: any[] }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '', price: '', inventoryCount: '0', 
    reorderPoint: '0', trackInventory: false, 
    type: 'RETAIL', sku: '', barcode: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error creating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/shops/${shopId}/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Error deleting product');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white">Products & Inventory</h2>
          <ProductBarcodeScannerWrapper shopId={shopId} products={products} />
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="bg-brand-gold text-slate-900 px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
          {isAdding ? 'Cancel' : 'Add Product'}
        </button>
      </div>

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

      <div className="bg-slate-800 rounded-lg border border-white/10 overflow-hidden">
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
                <td className="px-6 py-4 font-medium text-white">
                  {product.name}
                  {product.barcode && <p className="text-[10px] text-gray-500 font-mono mt-1">{product.barcode}</p>}
                </td>
                <td className="px-6 py-4">
                  <div className="bg-white p-1 rounded-md inline-block relative group">
                    <QRCodeSVG value={product.barcode || product.id} size={48} level="L" />
                    {/* Hover to enlarge feature */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 -translate-y-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 mb-2">
                      <div className="bg-white p-3 rounded-xl shadow-2xl border border-gray-200">
                        <QRCodeSVG value={product.barcode || product.id} size={128} level="L" />
                        <p className="text-center text-xs text-gray-500 font-mono mt-2 truncate w-32">{product.barcode || product.id}</p>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.type === 'RETAIL' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {product.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {product.trackInventory ? (
                    <ProductInventoryManager 
                      shopId={shopId} 
                      productId={product.id} 
                      currentCount={product.inventoryCount} 
                      lowStockThreshold={product.reorderPoint}
                    />
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
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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

