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
    setFormData({ name: '', description: '', price: '', inventoryCount: '0', reorderPoint: '0', trackInventory: false, type: 'RETAIL', sku: '', barcode: '', isSellable: true, imageUrl: '' });
    setEditingProduct(null);
  };

  const [formData, setFormData] = useState({
    name: '', description: '', price: '', inventoryCount: '0', 
    reorderPoint: '0', trackInventory: false, 
    type: 'RETAIL', sku: '', barcode: '', isSellable: true, imageUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'products');
      const res = await fetch(`/api/shops/${shopId}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFormData(prev => ({ ...prev, imageUrl: data.url }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

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
      description: product.description || '',
      price: product.price.toString(),
      inventoryCount: product.inventoryCount.toString(),
      reorderPoint: product.reorderPoint.toString(),
      trackInventory: product.trackInventory,
      type: product.type,
      sku: product.sku || '',
      barcode: product.barcode || '',
      isSellable: product.isSellable ?? true,
      imageUrl: product.imageUrl || ''
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
        <h2 className="font-bold text-crm-text text-xl font-bold">Products & Inventory</h2>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <ProductBarcodeScannerWrapper shopId={shopId} products={products} />
          <button onClick={() => {
            if (isAdding) {
              setIsAdding(false);
              resetForm();
            } else {
              setIsAdding(true);
            }
          }} className="bg-crm-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-status-pending transition-colors shrink-0">
            {isAdding ? 'Cancel' : 'Add Product'}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-crm-surface p-6 rounded-lg border border-crm-border shadow-sm space-y-4">
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">{editingProduct ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-crm-muted mb-1 text-[13px]">Name *</label>
              <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text" />
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-1 text-[13px]">Price ($) *</label>
              <input required type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text" />
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-1 text-[13px]">Type</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'RETAIL' | 'BACKBAR' })} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text">
                <option value="RETAIL">Retail</option>
                <option value="BACKBAR">Backbar (Shop Use)</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input type="checkbox" id="trackInventory" checked={formData.trackInventory} onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })} className="rounded border-crm-border bg-crm-bg text-crm-accent focus:ring-crm-primary" />
              <label htmlFor="trackInventory" className="font-medium text-crm-muted text-[13px]">Track Inventory</label>
            </div>
            
            <div className="flex items-center space-x-2 mt-6">
              <input type="checkbox" id="isSellable" checked={formData.isSellable} onChange={(e) => setFormData({ ...formData, isSellable: e.target.checked })} className="rounded border-crm-border bg-crm-bg text-crm-accent focus:ring-crm-primary" />
              <label htmlFor="isSellable" className="font-medium text-crm-muted text-[13px]">Sellable to Customer</label>
            </div>

            <div className="col-span-1 md:col-span-2 mt-2">
              <label className="block font-medium text-crm-muted mb-1 text-[13px]">Description (Optional)</label>
              <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text" placeholder="Product details..."></textarea>
            </div>

            {formData.isSellable && (
              <div className="col-span-1 md:col-span-2 mt-2">
                <label className="block font-medium text-crm-muted mb-1 text-[13px]">Product Image</label>
                <div className="flex items-center gap-4">
                  {formData.imageUrl && (
                    <img src={formData.imageUrl} alt="Product preview" className="w-16 h-16 object-cover rounded-lg border border-crm-border" />
                  )}
                  <label className="cursor-pointer bg-crm-surface border border-crm-border hover:border-crm-primary transition-colors px-4 py-2 rounded-lg text-[13px] font-medium text-crm-text">
                    {isUploading ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="hidden" />
                  </label>
                  {formData.imageUrl && (
                     <button type="button" onClick={() => setFormData({ ...formData, imageUrl: '' })} className="text-status-cancelled text-[13px] hover:underline">Remove</button>
                  )}
                </div>
              </div>
            )}

            {formData.trackInventory && (
              <>
                <div>
                  <label className="block font-medium text-crm-muted mb-1 text-[13px]">Current Stock</label>
                  <input type="number" min="0" value={formData.inventoryCount} onChange={(e) => setFormData({ ...formData, inventoryCount: e.target.value })} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text" />
                </div>
                <div>
                  <label className="block font-medium text-crm-muted mb-1 text-[13px]">Low Stock Alert (Reorder Point)</label>
                  <input type="number" min="0" value={formData.reorderPoint} onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text" />
                </div>
              </>
            )}
            <div>
              <label className="block font-medium text-crm-muted mb-1 text-[13px]">SKU (Optional)</label>
              <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text" />
            </div>
            <div>
              <label className="block font-medium text-crm-muted mb-1 text-[13px]">Barcode (Optional)</label>
              <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full bg-crm-bg border border-crm-border shadow-sm rounded-lg px-4 py-2 text-crm-text" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSubmitting} className="bg-crm-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-status-pending transition-colors disabled:opacity-50">
              {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Save Product'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-crm-surface rounded-lg border border-crm-border shadow-sm overflow-x-auto overflow-y-visible pb-32">
        <table className="w-full text-left text-[13px] text-crm-muted min-w-[700px]">
          <thead className="bg-crm-bg/50 text-[11px] uppercase text-crm-muted border-b border-crm-border">
            <tr>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Price</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Sellable</th>
              <th className="px-6 py-4">Stock</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-crm-surface transition-colors duration-200">
                <td className="px-6 py-4">
                  <div className="relative group inline-block">
                    <div 
                      onClick={() => handleEditClick(product)}
                      className="font-bold text-crm-text cursor-pointer hover:text-crm-accent transition-colors inline-block"
                    >
                      {product.name}
                    </div>
                    {product.barcode && <p className="text-crm-muted font-mono mt-1 text-[13px]">{product.barcode}</p>}
                    
                    <div className="absolute left-0 top-full mt-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                      <div className="bg-crm-surface p-4 rounded-xl shadow-2xl border border-crm-border shadow-sm min-w-[200px] flex flex-col items-center">
                        <Barcode value={product.barcode || product.id} displayValue={false} height={60} width={2} margin={0} background="transparent" />
                        <p className="text-center text-crm-muted font-mono mt-3 truncate max-w-full px-2 text-[13px]">{product.barcode || product.id}</p>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[11px] font-medium ${product.type === 'RETAIL' ? 'bg-status-info/20 text-status-info' : 'bg-crm-accent/20 text-crm-accent'}`}>
                    {product.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {product.isSellable ? (
                    <span className="text-status-confirmed">Yes</span>
                  ) : (
                    <span className="text-crm-muted">No</span>
                  )}
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
                    <span className="text-crm-muted">Not tracked</span>
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
                <td colSpan={6} className="px-6 py-8 text-center text-crm-muted">
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
