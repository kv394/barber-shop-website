"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fmtPrice, getCurrencySymbol } from '@/lib/formatters';
import ProductInventoryManager from './ProductInventoryManager';
import ProductBarcodeScannerWrapper from '@/components/checkout/ProductBarcodeScannerWrapper';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import MediaPicker from './MediaPicker';
import PurchaseOrderManager from './PurchaseOrderManager';

export default function ProductManager({ shopId, products, currency }: { shopId: string, products: any[], currency: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'PO'>('INVENTORY');
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

  
  const handleToggleSellable = async (product: any) => {
    try {
      const res = await fetch(`/api/shops/${shopId}/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, isSellable: !product.isSellable }),
      });
      if (!res.ok) throw new Error('Failed to toggle sellable status');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
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
      barcode: product.barcode || product.id,
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
    <div className="space-y-8 relative">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
        
        {/* Glassmorphic Pill Tab Switcher */}
        <div className="relative inline-flex items-center bg-white/5 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl">
          <div 
            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-crm-primary rounded-full transition-transform duration-300 ease-out shadow-[0_0_15px_rgba(var(--color-crm-primary),0.3)] ${activeTab === 'INVENTORY' ? 'translate-x-0' : 'translate-x-full left-[6px]'}`}
          ></div>
          
          <button 
            onClick={() => setActiveTab('INVENTORY')}
            className={`relative z-10 px-8 py-2.5 font-bold text-[14px] uppercase tracking-wider rounded-full transition-colors duration-300 ${activeTab === 'INVENTORY' ? 'text-white' : 'text-crm-muted hover:text-crm-text'}`}
          >
            Inventory
          </button>
          <button 
            onClick={() => setActiveTab('PO')}
            className={`relative z-10 px-8 py-2.5 font-bold text-[14px] uppercase tracking-wider rounded-full transition-colors duration-300 ${activeTab === 'PO' ? 'text-white' : 'text-crm-muted hover:text-crm-text'}`}
          >
            Purchase Orders
          </button>
        </div>
        
        {activeTab === 'INVENTORY' && (
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <ProductBarcodeScannerWrapper shopId={shopId} products={products} />
            <button onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                resetForm();
              } else {
                setIsAdding(true);
              }
            }} className="bg-gradient-to-r from-crm-primary to-crm-primary/80 text-white px-6 py-2.5 rounded-full font-black uppercase tracking-wider text-[13px] hover:shadow-[0_0_20px_rgba(var(--color-crm-primary),0.4)] transition-all shrink-0 border border-white/10 shadow-lg hover:scale-[1.02] active:scale-95">
              {isAdding ? '✕ Cancel' : '➕ Add Product'}
            </button>
          </div>
        )}
      </div>

      {activeTab === 'PO' ? (
        <PurchaseOrderManager shopId={shopId} products={products} currency={currency} />
      ) : (
        <>
          {isAdding && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300 ease-out mb-8">
              <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] space-y-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-crm-primary to-brand-gold"></div>
                <h3 className="font-bold text-crm-text text-xl flex items-center gap-3">
                  {editingProduct ? '✏️ Edit Product' : '📦 Add New Product'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Name *</label>
                    <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none placeholder:text-crm-muted/50" placeholder="e.g. Matte Clay Pomade" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Price ({getCurrencySymbol(currency)}) *</label>
                    <input required type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Type</label>
                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as 'RETAIL' | 'BACKBAR' })} className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none appearance-none">
                      <option value="RETAIL">Retail</option>
                      <option value="BACKBAR">Backbar (Shop Use)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-3 justify-center md:pl-4">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input type="checkbox" id="trackInventory" checked={formData.trackInventory} onChange={(e) => setFormData({ ...formData, trackInventory: e.target.checked })} className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-crm-bg/50 checked:bg-crm-primary checked:border-crm-primary transition-all cursor-pointer" />
                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="font-medium text-crm-text group-hover:text-crm-primary transition-colors text-[14px]">Track Inventory</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center w-5 h-5">
                        <input type="checkbox" id="isSellable" checked={formData.isSellable} onChange={(e) => setFormData({ ...formData, isSellable: e.target.checked })} className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-crm-bg/50 checked:bg-crm-primary checked:border-crm-primary transition-all cursor-pointer" />
                        <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <span className="font-medium text-crm-text group-hover:text-crm-primary transition-colors text-[14px]">Sellable to Customer</span>
                    </label>
                  </div>
      
                  <div className="col-span-1 md:col-span-2 space-y-1.5 mt-2">
                    <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Description (Optional)</label>
                    <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none placeholder:text-crm-muted/50" placeholder="Product details..."></textarea>
                  </div>
      
                  <div className="col-span-1 md:col-span-2 space-y-1.5 mt-2">
                    <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Product Image</label>
                    <div className="p-1 bg-crm-bg/30 rounded-xl border border-white/5">
                      <MediaPicker shopId={shopId} currentUrl={formData.imageUrl} onSelect={(url) => setFormData({ ...formData, imageUrl: url })} label="Upload/Select Product Image" />
                    </div>
                  </div>
      
                  {formData.trackInventory && (
                    <>
                      <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                        <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Current Stock</label>
                        <input type="number" min="0" value={formData.inventoryCount} onChange={(e) => setFormData({ ...formData, inventoryCount: e.target.value })} className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none" />
                      </div>
                      <div className="space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                        <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Low Stock Alert (Reorder Point)</label>
                        <input type="number" min="0" value={formData.reorderPoint} onChange={(e) => setFormData({ ...formData, reorderPoint: e.target.value })} className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none" />
                      </div>
                    </>
                  )}
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">SKU (Optional)</label>
                    <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none placeholder:text-crm-muted/50" placeholder="e.g. POM-MATTE-01" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Barcode (Optional)</label>
                    <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} placeholder={editingProduct ? editingProduct.id : 'Scan or enter custom barcode'} className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none placeholder:text-crm-muted/50 font-mono" />
                  </div>
                </div>
                
                <div className="flex justify-end pt-6 border-t border-white/10 mt-6">
                  <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-crm-primary to-crm-primary/80 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[13px] hover:shadow-[0_0_20px_rgba(var(--color-crm-primary),0.4)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100">
                    {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Save Product'}
                  </button>
                </div>
              </form>
            </div>
          )}

      <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-x-auto overflow-y-visible pb-32 mt-4 relative">
        <table className="w-full text-left text-[14px] text-crm-muted min-w-[700px]">
          <thead className="bg-white/5 backdrop-blur-xl border-b border-white/10 text-[11px] uppercase tracking-widest text-crm-text font-bold">
            <tr>
              <th className="px-6 py-5">Product Name</th>
              <th className="px-6 py-5">Price</th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Sellable</th>
              <th className="px-6 py-5">Stock</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-white/10 transition-colors duration-300 group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover shadow-lg border border-white/10 bg-black/20 group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl shadow-lg border border-white/10 bg-black/20 flex items-center justify-center text-crm-muted group-hover:scale-105 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      </div>
                    )}
                    <div className="relative group/barcode inline-block">
                      <div
                        onClick={() => handleEditClick(product)}
                        className="font-bold text-crm-text text-[15px] cursor-pointer hover:text-crm-primary transition-colors inline-block"
                      >
                        {product.name}
                      </div>
                      {product.barcode && <p className="text-crm-muted font-mono mt-1 text-[12px] opacity-70 group-hover:opacity-100 transition-opacity">{product.barcode}</p>}

                      <div className="absolute left-0 top-full mt-2 opacity-0 pointer-events-none group-hover/barcode:opacity-100 group-hover/barcode:pointer-events-auto transition-opacity z-50">
                        <div className="bg-crm-surface/95 backdrop-blur-xl p-4 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/20 min-w-[200px] flex flex-col items-center">
                          <Barcode value={product.barcode || product.id} displayValue={false} height={60} width={2} margin={0} background="transparent" lineColor="currentColor" />
                          <p className="text-center text-crm-text font-mono mt-3 truncate max-w-full px-2 text-[13px] opacity-80">{product.barcode || product.id}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-crm-text">{fmtPrice(product.price, currency)}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider shadow-sm border ${product.type === 'RETAIL' ? 'bg-status-info/10 text-status-info border-status-info/20' : 'bg-crm-accent/10 text-crm-accent border-crm-accent/20'}`}>
                    {product.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleSellable(product)}
                    className={`relative px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all duration-300 overflow-hidden group/btn ${product.isSellable ? 'text-status-confirmed border border-status-confirmed/30 bg-status-confirmed/10 hover:bg-status-confirmed/20' : 'text-crm-muted border border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    {product.isSellable ? 'YES' : 'NO'}
                  </button>
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
                    <span className="text-crm-muted italic text-[13px] opacity-70">Not tracked</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleDelete(product.id)} className="text-status-cancelled/70 hover:text-status-cancelled transition-colors font-semibold text-[13px] uppercase tracking-wider p-2 hover:bg-status-cancelled/10 rounded-lg">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-crm-muted">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <span className="text-4xl opacity-50">📦</span>
                    <p className="text-[14px]">No products found. Add your first product to manage inventory!</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        </>
      )}
    </div>
  );
}
