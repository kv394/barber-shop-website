'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Shop {
  id: string;
  name: string;
}

export default function ShopSwitcher({ currentShopId, currentShopName, shops, userRole }: { currentShopId: string, currentShopName: string, shops: Shop[], userRole?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectShop = (shopId: string) => {
    setIsOpen(false);
    if (shopId === currentShopId) return;

    // Try to preserve the rest of the path if possible
    const currentPath = pathname || '';
    const newPath = currentPath.replace(`/shop/${currentShopId}`, `/shop/${shopId}`);
    
    router.push(newPath);
  };

  const handleCreateLocation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const kioskEmail = formData.get('kioskEmail') as string;

    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, kioskEmail })
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to create location');
        setIsCreating(false);
        return;
      }

      const newShop = await res.json();
      setIsModalOpen(false);
      setIsCreating(false);
      setIsOpen(false);
      
      // Navigate to new shop
      router.push(`/shop/${newShop.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Network error while creating location');
      setIsCreating(false);
    }
  };

  // Don't show switcher if user only has 1 shop AND they aren't a SHOP_ADMIN who can create more
  const canCreate = userRole === 'SHOP_ADMIN' || userRole === 'SITE_ADMIN';
  if ((!shops || shops.length <= 1) && !canCreate) {
    return <span className="font-bold text-xl truncate tracking-tight text-crm-text">{currentShopName}</span>;
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-bold text-xl tracking-tight text-crm-text hover:bg-crm-bg px-2 py-1 -ml-2 rounded-md transition-colors"
      >
        <span className="truncate">{currentShopName}</span>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-crm-surface border border-crm-border rounded-md shadow-lg overflow-hidden z-50">
          <div className="max-h-60 overflow-y-auto">
            {shops?.map(shop => (
              <button
                key={shop.id}
                onClick={() => handleSelectShop(shop.id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-crm-bg transition-colors ${shop.id === currentShopId ? 'bg-crm-bg font-bold text-orange-600' : 'text-crm-text'}`}
              >
                {shop.name}
              </button>
            ))}
            
            {canCreate && (
              <div className="border-t border-crm-border mt-1">
                <button
                  onClick={() => { setIsOpen(false); setIsModalOpen(true); }}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-crm-primary hover:bg-crm-bg transition-colors flex items-center gap-2"
                >
                  <span className="text-lg leading-none">+</span> Create New Location
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-crm-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-crm-border">
              <h2 className="text-xl font-bold text-crm-text">Create New Location</h2>
              <p className="text-[13px] text-crm-muted mt-1">Add a new franchise location to your account.</p>
            </div>
            
            <form onSubmit={handleCreateLocation} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[13px] font-semibold text-crm-muted uppercase tracking-wider mb-1.5">Location Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    placeholder="e.g. Downtown Barbershop" 
                    className="w-full bg-crm-bg border border-crm-border rounded-lg p-2.5 text-crm-text focus:ring-2 focus:ring-crm-primary outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-[13px] font-semibold text-crm-muted uppercase tracking-wider mb-1.5">Kiosk Login Email</label>
                  <p className="text-[11px] text-crm-muted mb-2">Used to sign in to the front-desk tablet for this location.</p>
                  <input 
                    type="email" 
                    name="kioskEmail" 
                    required 
                    placeholder="downtown-kiosk@example.com" 
                    className="w-full bg-crm-bg border border-crm-border rounded-lg p-2.5 text-crm-text focus:ring-2 focus:ring-crm-primary outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  className="flex-1 bg-crm-bg hover:bg-gray-200 text-crm-text font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="flex-1 bg-crm-primary hover:bg-crm-primary/90 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}