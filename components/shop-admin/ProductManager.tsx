"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProductInventoryManager from './ProductInventoryManager';
import ProductBarcodeScannerWrapper from '@/components/checkout/ProductBarcodeScannerWrapper';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

export default function ProductManager({ shopId, products }: { shopId: string, products: any[] }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editingBarcodeId, setEditingBarcodeId] = useState<string | null>(null);
  const [editBarcodeValue, setEditBarcodeValue] = useState('');
  
  const resetForm = () => {
    setFormData({ name: '', price: '', inventoryCount: '0', reorderPoint: '0', trackInventory: false, type: 'RETAIL', sku: '', barcode: '' });
    setEditingProduct(null);
  };

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
      const url = editingProduct 
        ? `/api/shops/${shopId}/products/${editingProduct.id}`
        : `/api/shops/${shopId}/products`;
        
      const res = await fetch(url, {
        method: editingProduct ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          inventoryCount: parseInt(formData.inventoryCount),
          reorderPoint: parseInt(formData.reorderPoint)
        }),
      });

      if (!res.ok) throw new Error(editingProduct ? 'Failed to update product' : 'Failed to create product');

      setIsAdding(false);
      resetForm();
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(editingProduct ? 'Error updating product' : 'Error creating product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      inventoryCount: product.inventoryCount.toString(),
      reorderPoint: product.reorderPoint.toString(),
      trackInventory: product.trackInventory,
      type: product.type,
      sku: product.sku || '',
      barcode: product.barcode || ''
    });
    setIsAdding(true);
    // Scroll to top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="font-bold text-botanical-text text-3xl md:text-4xl">Products & Inventory</h2>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <ProductBarcodeScannerWrapper shopId={shopId} products={products} />
          <button onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              resetForm();
            } else {
              setIsAdding(true);
            }
          }} className="bg-botanical-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-status-pending transition-colors shrink-0">
            {isAdding ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-botanical-surface p-6 rounded-lg border border-botanical-border shadow-sm space-y-4">
          <h3 className="font-bold text-botanical-text mb-4 text-2xl md:text-3xl">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-botanical-muted mb-1 text-sm">Name *</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded-lg px-4 py-2 text-botanical-text" />
            </div>
            <div>
              <label className="block font-medium text-botanical-muted mb-1 text-sm">Price ($) *</label>
              <input required type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded-lg px-4 py-2 text-botanical-text" />
            </div>
            <div>
              <label className="block font-medium text-botanical-muted mb-1 text-sm">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'RETAIL' | 'BACKBAR' })} className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded-lg px-4 py-2 text-botanical-text">
                <option value="RETAIL">Retail</option>
                <option value="BACKBAR">Backbar (Shop Use)</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input type="checkbox" id="trackInventory" checked={formData.trackInventory} onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })} className="rounded border-botanical-border bg-botanical-bg text-botanical-accent focus:ring-botanical-primary" />
              <label htmlFor="trackInventory" className="font-medium text-botanical-muted text-sm">Track Inventory</label>
            </div>
            
            {formData.trackInventory && (
              <>
                <div>
                  <label className="block font-medium text-botanical-muted mb-1 text-sm">Current Stock</label>
                  <input type="number" min="0" value={formData.inventoryCount} onChange={(e) => setFormData({ ...formData, inventoryCount: e.target.value })} className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded-lg px-4 py-2 text-botanical-text" />
                </div>
                <div>
                  <label className="block font-medium text-botanical-muted mb-1 text-sm">Low Stock Alert (Reorder Point)</label>
                  <input type="number" min="0" value={formData.reorderPoint} onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })} className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded-lg px-4 py-2 text-botanical-text" />
                </div>
              </>
            )}
            <div>
              <label className="block font-medium text-botanical-muted mb-1 text-sm">SKU (Optional)</label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded-lg px-4 py-2 text-botanical-text" />
            </div>
            <div>
              <label className="block font-medium text-botanical-muted mb-1 text-sm">Barcode (Optional)</label>
              <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full bg-botanical-bg border border-botanical-border shadow-sm rounded-lg px-4 py-2 text-botanical-text" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSubmitting} className="bg-botanical-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-status-pending transition-colors disabled:opacity-50">
              {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Save Product'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-botanical-surface rounded-lg border border-botanical-border shadow-sm overflow-x-auto overflow-y-visible pb-32">
        <table className="w-full text-left text-sm text-botanical-muted min-w-[700px]">
          <thead className="bg-botanical-bg/50 text-xs uppercase text-botanical-muted border-b border-botanical-border">
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
              <tr key={product.id} className="hover:bg-botanical-surface transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="relative group inline-block">
                    <div 
                      onClick={() => handleEditClick(product)}
                      className="font-bold text-botanical-text cursor-pointer hover:text-botanical-accent transition-colors inline-block"
                    >
                      {product.name}
                    </div>
                    {product.barcode && <p className="text-botanical-muted font-mono mt-1 text-base md:text-lg">{product.barcode}</p>}
                    
                    <div className="absolute left-0 top-full mt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      <div className="bg-botanical-surface p-4 rounded-xl shadow-2xl border border-botanical-border shadow-sm min-w-[200px] flex flex-col items-center">
                        <Barcode value={product.barcode || product.id} displayValue={false} height={60} width={2} margin={0} background="transparent" />
                        <p className="text-center text-botanical-muted font-mono mt-3 truncate max-w-full px-2 text-base md:text-lg">{product.barcode || product.id}</p>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.type === 'RETAIL' ? 'bg-status-info/20 text-status-info' : 'bg-botanical-accent/20 text-botanical-accent'}`}>
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
                    <span className="text-botanical-muted">Not tracked</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(product.id)} className="text-status-cancelled hover:text-status-cancelled transition-colors">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-botanical-muted">
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
