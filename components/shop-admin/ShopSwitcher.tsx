'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Shop {
  id: string;
  name: string;
}

export default function ShopSwitcher({ currentShopId, currentShopName, shops }: { currentShopId: string, currentShopName: string, shops: Shop[] }) {
  const [isOpen, setIsOpen] = useState(false);
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

  // Don't show switcher if user only has 1 shop
  if (!shops || shops.length <= 1) {
    return <span className="font-bold text-xl truncate tracking-tight text-crm-text">{currentShopName}</span>;
  }

  const handleSelectShop = (shopId: string) => {
    setIsOpen(false);
    if (shopId === currentShopId) return;

    // Try to preserve the rest of the path if possible
    const currentPath = pathname || '';
    const newPath = currentPath.replace(`/shop/${currentShopId}`, `/shop/${shopId}`);
    
    router.push(newPath);
  };

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
            {shops.map(shop => (
              <button
                key={shop.id}
                onClick={() => handleSelectShop(shop.id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-crm-bg transition-colors ${shop.id === currentShopId ? 'bg-crm-bg font-bold text-orange-600' : 'text-crm-text'}`}
              >
                {shop.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
