'use client';;
import Image from 'next/image';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fmtPrice } from '@/lib/formatters';

export default function PurchaseOrderManager({ shopId, products, currency }: { shopId: string, products: any[], currency: string }) {
 const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [isCreating, setIsCreating] = useState(false);
 const [supplier, setSupplier] = useState('');
 const [items, setItems] = useState<{ productId: string, quantity: number, unitCost: number }[]>([]);
 const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
 const [notes, setNotes] = useState('');
 const [receivingPoId, setReceivingPoId] = useState<string | null>(null);
 const [receivedItems, setReceivedItems] = useState<Record<string, number>>({});
 
 const router = useRouter();

 const loadPOs = async () => {
 try {
 const res = await fetch(`/api/shops/${shopId}/purchase-orders`);
 const data = await res.json();
 setPurchaseOrders(Array.isArray(data) ? data : []);
 } catch (e) {
 console.error(e);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 loadPOs();
 }, [shopId]);

 const addItem = () => setItems([...items, { productId: '', quantity: 1, unitCost: 0 }]);
 const updateItem = (index: number, field: string, value: any) => {
 const newItems = [...items];
 newItems[index] = { ...newItems[index], [field]: value };
 setItems(newItems);
 };
 const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

 const handleCreate = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!supplier || items.length === 0 || items.some(i => !i.productId)) {
 alert("Please fill all required fields");
 return;
 }

 try {
 const res = await fetch(`/api/shops/${shopId}/purchase-orders`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 supplier,
 expectedDeliveryDate: expectedDeliveryDate || null,
 notes,
 items,
 totalAmount: items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
 })
 });
 if (!res.ok) {
 const errData = await res.json().catch(() => ({}));
 throw new Error(errData.error || "Failed to create PO");
 }
 setIsCreating(false);
 setSupplier('');
 setItems([]);
 setExpectedDeliveryDate('');
 setNotes('');
 loadPOs();
 } catch (e: any) {
 alert(e.message);
 }
 };

 const handleReceive = async (poId: string) => {
 try {
 const res = await fetch(`/api/shops/${shopId}/purchase-orders/${poId}`, {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 status: 'RECEIVED',
 receivedItems
 })
 });
 if (!res.ok) throw new Error("Failed to receive PO");
 setReceivingPoId(null);
 setReceivedItems({});
 loadPOs();
 router.refresh(); // Refresh inventory counts everywhere
 } catch (e: any) {
 alert(e.message);
 }
 };

 if (loading) return <div className="text-crm-muted p-4">Loading purchase orders...</div>;

 return (
 <div className="space-y-6">
 <div className="flex justify-between items-center mb-6">
 <h3 className="font-bold text-crm-text text-xl">Purchase Orders</h3>
 <button onClick={() => setIsCreating(!isCreating)} className="bg-gradient-to-r from-crm-primary to-crm-primary/80 text-white px-6 py-2.5 rounded-full font-black uppercase tracking-wider text-[13px] hover:shadow-[0_0_20px_rgba(var(--color-crm-primary),0.4)] transition-all shrink-0 border border-white/10 shadow-lg hover:scale-[1.02] active:scale-95">
 {isCreating ? '✕ Cancel' : '➕ Create PO'}
 </button>
 </div>

 {isCreating && (
 <div className="animate-in fade-in slide-in-from-top-4 duration-300 ease-out mb-8">
 <form onSubmit={handleCreate} className="bg-white/5 backdrop-blur-xl p-8 border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] space-y-6 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-crm-primary to-brand-indigo"></div>
 <h3 className="font-bold text-crm-text text-lg">📝 New Purchase Order</h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-1.5">
 <label className="block text-[13px] font-bold text-crm-muted uppercase tracking-wider">Supplier *</label>
 <input type="text" required value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full px-4 py-3 bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none" placeholder="e.g. Suavecito Wholesale" />
 </div>
 <div className="space-y-1.5">
 <label className="block text-[13px] font-bold text-crm-muted uppercase tracking-wider">Expected Delivery</label>
 <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className="w-full px-4 py-3 bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none [&::-webkit-calendar-picker-indicator]:invert-[0.8]" />
 </div>
 </div>
 
 <div className="space-y-3 bg-black/10 p-5 rounded-xl border border-white/5">
 <label className="block text-[13px] font-bold text-crm-muted uppercase tracking-wider">Products *</label>
 <div className="space-y-3">
 {items.map((item, i) => (
 <div key={i} className="flex flex-wrap gap-3 items-center">
 <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required className="flex-1 min-w-[200px] px-4 py-3 bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none appearance-none">
 <option value="">Select Product...</option>
 {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.inventoryCount})</option>)}
 </select>
 <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value))} placeholder="Qty" className="w-24 px-4 py-3 bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none text-center" />
 <input type="number" step="0.01" value={item.unitCost} onChange={e => updateItem(i, 'unitCost', parseFloat(e.target.value))} placeholder="Unit Cost" className="w-32 px-4 py-3 bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none" />
 <button type="button" onClick={() => removeItem(i)} className="text-status-cancelled/70 hover:text-status-cancelled hover:bg-status-cancelled/10 text-xl font-bold w-10 h-10 flex items-center justify-center rounded-lg transition-colors">×</button>
 </div>
 ))}
 </div>
 <button type="button" onClick={addItem} className="text-crm-primary hover:text-crm-primary/80 text-[13px] font-black uppercase tracking-wider mt-2 transition-colors flex items-center gap-1">
 <span>➕</span> Add Product Line
 </button>
 </div>
 
 <div className="space-y-1.5">
 <label className="block text-[13px] font-bold text-crm-muted uppercase tracking-wider">Notes</label>
 <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-4 py-3 bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none" rows={2} placeholder="Any delivery instructions or references..."></textarea>
 </div>
 
 <div className="flex justify-end pt-4 border-t border-white/10">
 <button type="submit" className="bg-gradient-to-r from-crm-primary to-crm-primary/80 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[13px] hover:shadow-[0_0_20px_rgba(var(--color-crm-primary),0.4)] transition-all hover:scale-[1.02] active:scale-95">Save Purchase Order</button>
 </div>
 </form>
 </div>
 )}

 <div className="space-y-6 relative">
 {purchaseOrders.length === 0 ? (
 <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center text-crm-muted">
 <div className="text-4xl opacity-50 mb-3">📄</div>
 <p className="text-[14px]">No purchase orders found. Create your first PO to restock inventory!</p>
 </div>
 ) : (
 purchaseOrders.map(po => (
 <div key={po.id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:bg-white/10 transition-all duration-300 group">
 <div className="flex flex-wrap justify-between items-start mb-6 gap-4 border-b border-white/10 pb-4">
 <div>
 <h4 className="font-bold text-crm-text text-lg flex items-center gap-2">
 <span className="text-2xl">📦</span> {po.supplier}
 </h4>
 <p className="text-crm-muted text-[13px] mt-1">Expected Delivery: <span className="font-semibold text-crm-text">{po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate).toLocaleDateString() : 'TBD'}</span></p>
 </div>
 <div className="text-right">
 <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase mb-2 shadow-sm ${po.status === 'PENDING' ? 'bg-status-pending/20 text-status-pending border border-status-pending/30' : 'bg-status-confirmed/20 text-status-confirmed border border-status-confirmed/30'}`}>
 {po.status}
 </span>
 <p className="font-black text-crm-text text-xl">{fmtPrice(po.totalAmount, currency)}</p>
 </div>
 </div>

 <div className="space-y-3">
 <h5 className="text-[11px] font-bold text-crm-muted uppercase tracking-widest">Order Items</h5>
 <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
 {po.items.map((item: any) => (
 <div key={item.id} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
 <div className="flex flex-col">
 <span className="text-crm-text font-semibold text-[14px]">{item.product.name}</span>
 <span className="text-crm-muted text-[12px]">{item.quantity} units @ {fmtPrice(item.unitCost, currency)}</span>
 </div>
 {po.status === 'PENDING' && receivingPoId === po.id ? (
 <div className="flex items-center gap-2">
 <label className="text-[11px] font-bold text-crm-muted uppercase">Rcvd:</label>
 <input 
 type="number" 
 min="0" 
 max={item.quantity}
 value={receivedItems[item.id] ?? item.quantity}
 onChange={(e) => setReceivedItems({...receivedItems, [item.id]: parseInt(e.target.value) || 0})}
 className="w-16 px-3 py-2 text-center text-[13px] bg-crm-bg/50 border border-white/10 rounded-lg text-crm-text focus:ring-2 focus:ring-crm-primary outline-none"
 />
 </div>
 ) : (
 <div className="text-right">
 <span className="text-crm-text font-bold">{fmtPrice(item.quantity * item.unitCost, currency)}</span>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>

 {po.notes && (
 <div className="mt-4 p-4 bg-crm-bg/30 rounded-xl border border-white/5 text-[13px] text-crm-muted">
 <strong className="text-crm-text block mb-1">Notes:</strong>
 {po.notes}
 </div>
 )}

 {po.status === 'PENDING' && (
 <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
 {receivingPoId === po.id ? (
 <>
 <button onClick={() => setReceivingPoId(null)} className="px-5 py-2 rounded-xl text-[13px] font-bold text-crm-muted hover:text-crm-text hover:bg-white/5 transition-colors">Cancel</button>
 <button onClick={() => handleReceive(po.id)} className="bg-gradient-to-r from-status-confirmed to-status-confirmed/80 text-white px-6 py-2 rounded-xl font-bold text-[13px] hover:shadow-[0_0_15px_rgba(var(--color-status-confirmed),0.4)] transition-all uppercase tracking-wider">Confirm Receipt</button>
 </>
 ) : (
 <button onClick={() => {
 setReceivingPoId(po.id);
 const initialReceived: Record<string, number> = {};
 po.items.forEach((i: any) => initialReceived[i.id] = i.quantity);
 setReceivedItems(initialReceived);
 }} className="bg-white/10 border border-white/20 text-crm-text px-6 py-2 rounded-xl font-bold text-[13px] hover:bg-white/20 transition-all uppercase tracking-wider group-hover:border-white/30">Receive Items</button>
 )}
 </div>
 )}
 </div>
 ))
 )}
 </div>
 </div>
 );
}
