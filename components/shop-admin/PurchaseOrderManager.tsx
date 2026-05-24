'use client';

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
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-crm-text text-lg">Purchase Orders</h3>
        <button onClick={() => setIsCreating(!isCreating)} className="bg-crm-primary text-white px-4 py-2 rounded-lg font-bold text-[13px]">
          {isCreating ? 'Cancel' : 'Create PO'}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-crm-surface p-4 border border-crm-border rounded-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-[11px] font-bold text-crm-muted uppercase mb-1">Supplier *</label>
               <input type="text" required value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full p-2 text-[13px] bg-crm-bg border border-crm-border rounded" />
             </div>
             <div>
               <label className="block text-[11px] font-bold text-crm-muted uppercase mb-1">Expected Delivery</label>
               <input type="date" value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} className="w-full p-2 text-[13px] bg-crm-bg border border-crm-border rounded" />
             </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-crm-muted uppercase mb-1">Products *</label>
            {items.map((item, i) => (
              <div key={i} className="flex gap-2 items-center bg-crm-bg p-2 rounded border border-crm-border">
                <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required className="flex-1 p-2 text-[13px] bg-crm-surface border border-crm-border rounded">
                  <option value="">Select Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.inventoryCount})</option>)}
                </select>
                <input type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value))} placeholder="Qty" className="w-24 p-2 text-[13px] bg-crm-surface border border-crm-border rounded" />
                <input type="number" step="0.01" value={item.unitCost} onChange={e => updateItem(i, 'unitCost', parseFloat(e.target.value))} placeholder="Unit Cost" className="w-24 p-2 text-[13px] bg-crm-surface border border-crm-border rounded" />
                <button type="button" onClick={() => removeItem(i)} className="text-status-cancelled text-lg font-bold px-2">×</button>
              </div>
            ))}
            <button type="button" onClick={addItem} className="text-crm-primary text-[13px] font-bold">+ Add Product Line</button>
          </div>

          <div>
             <label className="block text-[11px] font-bold text-crm-muted uppercase mb-1">Notes</label>
             <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 text-[13px] bg-crm-bg border border-crm-border rounded" rows={2}></textarea>
          </div>

          <button type="submit" className="w-full py-2 bg-status-confirmed text-white rounded-lg font-bold">Submit Purchase Order</button>
        </form>
      )}

      <div className="space-y-4">
        {purchaseOrders.length === 0 ? (
           <p className="text-crm-muted text-[13px]">No purchase orders found.</p>
        ) : (
           purchaseOrders.map(po => (
             <div key={po.id} className="bg-crm-surface border border-crm-border rounded-xl p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-crm-text">{po.supplier}</h4>
                    <p className="text-[11px] text-crm-muted">Ordered: {new Date(po.createdAt).toLocaleDateString()}</p>
                    {po.expectedDeliveryDate && <p className="text-[11px] text-crm-muted">Expected: {new Date(po.expectedDeliveryDate).toLocaleDateString()}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] px-2 py-1 rounded-full font-bold uppercase ${po.status === 'RECEIVED' ? 'bg-status-confirmed/20 text-status-confirmed' : 'bg-status-pending/20 text-status-pending'}`}>
                      {po.status}
                    </span>
                    <p className="font-bold mt-1">{fmtPrice(po.totalAmount, currency)}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-crm-border pt-4">
                  <p className="text-[11px] font-bold text-crm-muted uppercase">Items</p>
                  {po.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-[13px]">
                       <span>{item.quantity}x {item.product.name}</span>
                       <span className="text-crm-muted">{fmtPrice(item.unitCost, currency)} / ea</span>
                    </div>
                  ))}
                </div>

                {po.status !== 'RECEIVED' && (
                  <div className="mt-4 pt-4 border-t border-crm-border">
                    {receivingPoId === po.id ? (
                      <div className="space-y-4">
                        <p className="text-[11px] font-bold text-status-pending uppercase">Verify Received Quantities</p>
                        {po.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center text-[13px] gap-4">
                            <span className="flex-1 truncate">{item.product.name} (Ordered: {item.quantity})</span>
                            <div className="flex items-center gap-2 shrink-0">
                               <label className="text-[11px] text-crm-muted">Received:</label>
                               <input type="number" min="0" 
                                 value={receivedItems[item.id] !== undefined ? receivedItems[item.id] : item.quantity}
                                 onChange={e => setReceivedItems({...receivedItems, [item.id]: parseInt(e.target.value) || 0})}
                                 className="w-16 p-1 bg-crm-bg border border-crm-border rounded text-center" />
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 justify-end">
                           <button onClick={() => setReceivingPoId(null)} className="px-4 py-2 text-[13px] border border-crm-border rounded">Cancel</button>
                           <button onClick={() => handleReceive(po.id)} className="px-4 py-2 text-[13px] bg-status-confirmed text-white rounded font-bold">Confirm Receipt & Update Inventory</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setReceivingPoId(po.id)} className="w-full py-2 bg-status-pending text-white font-bold rounded-lg text-[13px]">
                        Mark as Received
                      </button>
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
