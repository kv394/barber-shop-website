'use client';

import { useState, FormEvent } from 'react';

export default function CreateServiceForm({ shopId }: { shopId: string }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [processingTime, setProcessingTime] = useState('');
  const [finishingTime, setFinishingTime] = useState('');
  const [trackInventory, setTrackInventory] = useState(false);
  const [serviceType, setServiceType] = useState<'CUSTOMER' | 'INTERNAL'>('CUSTOMER');
  
  // New fields for inventory
  const [itemType, setItemType] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [bufferMinutes, setBufferMinutes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const isInternal = serviceType === 'INTERNAL';
    const finalDuration = isInternal ? 0 : (duration ? Number(duration) : 0);

    try {
      const response = await fetch(`/api/shops/${shopId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(), 
          description: description.trim(), 
          price: price ? Number(price) : 0, 
          duration: finalDuration, 
          processingTime: isInternal ? 0 : (processingTime ? Number(processingTime) : 0),
          finishingTime: isInternal ? 0 : (finishingTime ? Number(finishingTime) : 0),
          trackInventory: isInternal ? true : trackInventory,
          type: serviceType, 
          itemType: isInternal ? itemType.trim() : null,
          brand: isInternal ? brand.trim() : null,
          barcode: barcode.trim() || null,
          bufferMinutes: !isInternal && bufferMinutes ? Number(bufferMinutes) : 0,
          imageUrl: imageUrl.trim() || null,
        }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create item.");
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const isInternal = serviceType === 'INTERNAL';

  return (
    <form onSubmit={handleSubmit} className="mt-8 pt-6 border-t border-botanical-border" noValidate>
      <h3 className="font-serif text-xl text-botanical-accent mb-6">
        {isInternal ? 'Add Inventory Item' : 'Add New Service'}
      </h3>
      
      {error && <div className="p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm mb-4">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <select 
          value={serviceType} 
          onChange={e => setServiceType(e.target.value as 'CUSTOMER' | 'INTERNAL')} 
          className="bg-black/40 border border-botanical-border rounded p-3 text-botanical-text focus:outline-none focus:ring-1 focus:ring-brand-gold md:col-span-2"
        >
          <option value="CUSTOMER">Customer-Facing Service</option>
          <option value="INTERNAL">Internal Inventory Item</option>
        </select>

        <input 
          type="text" 
          placeholder={isInternal ? "Item Name (e.g. Pomade, Towel)" : "Service Name (e.g. Classic Cut)"} 
          value={name} 
          onChange={e => setName(e.target.value)} 
          className="bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
        />
        
        <input 
          type="text" 
          placeholder={isInternal ? "Cost per unit ($)" : "Price ($)"} 
          value={price} 
          onChange={e => { const val = e.target.value; if (val === '' || /^\d*\.?\d*$/.test(val)) setPrice(val); }} 
          className="bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
        />
        
        {/* Render different fields based on type */}
        {!isInternal ? (
          <>
            <input 
              type="text" 
              placeholder="Initial Active Time (minutes)" 
              value={duration} 
              onChange={e => { const val = e.target.value; if (val === '' || /^\d+$/.test(val)) setDuration(val); }} 
              className="bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
            />
            <input 
              type="text" 
              placeholder="Processing Time (minutes, optional)" 
              value={processingTime} 
              onChange={e => { const val = e.target.value; if (val === '' || /^\d+$/.test(val)) setProcessingTime(val); }} 
              className="bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
            />
            <input 
              type="text" 
              placeholder="Finishing Time (minutes, optional)" 
              value={finishingTime} 
              onChange={e => { const val = e.target.value; if (val === '' || /^\d+$/.test(val)) setFinishingTime(val); }} 
              className="bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
            />
            <input
              type="text"
              placeholder="Buffer time between bookings (mins, optional)"
              value={bufferMinutes}
              onChange={e => { const val = e.target.value; if (val === '' || /^\d+$/.test(val)) setBufferMinutes(val); }}
              className="bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            />
            <div className="md:col-span-1">
              <input 
                type="text" 
                placeholder="Short Description (optional)" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
              />
            </div>
            <div className="md:col-span-1">
              <input
                type="url"
                placeholder="Image URL (optional)"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </>
        ) : (
          <>
            <input 
              type="text" 
              placeholder="Item Type (e.g. Shampoo, Gel)" 
              value={itemType} 
              onChange={e => setItemType(e.target.value)} 
              className="bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
            />
            <input 
              type="text" 
              placeholder="Brand (e.g. American Crew)" 
              value={brand} 
              onChange={e => setBrand(e.target.value)} 
              className="bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
            />
            <div className="md:col-span-2">
                <input 
                type="text" 
                placeholder="Barcode (Optional) - Type or Scan later" 
                value={barcode} 
                onChange={e => setBarcode(e.target.value)} 
                className="w-full bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold font-mono" 
                />
            </div>
             <div className="md:col-span-2">
              <input 
                type="text" 
                placeholder="Notes / Description (optional)" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                className="w-full bg-black/40 border border-botanical-border rounded p-3 text-botanical-text placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-gold" 
              />
            </div>
          </>
        )}
      </div>

      {!isInternal && (
        <div className="flex items-center space-x-3 py-4 mt-4">
          <input type="checkbox" id="trackInventory" checked={trackInventory} onChange={(e) => setTrackInventory(e.target.checked)} className="w-4 h-4 accent-brand-gold bg-botanical-border border-botanical-border rounded focus:ring-brand-gold" />
          <label htmlFor="trackInventory" className="text-sm text-botanical-muted cursor-pointer select-none">
            Enable Inventory Tracking for this service
          </label>
        </div>
      )}

      {isInternal && (
          <div className="py-4 mt-4 text-sm text-blue-300">
              ℹ️ Inventory tracking is automatically enabled for internal items.
          </div>
      )}

      <button 
        type="submit" 
        disabled={isSubmitting || !name || !price || (!isInternal && !duration)} 
        className="w-full bg-botanical-primary text-white font-semibold py-3 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
      >
        {isSubmitting ? 'Saving...' : (isInternal ? 'Save Inventory Item' : 'Save Service')}
      </button>
    </form>
  );
}
