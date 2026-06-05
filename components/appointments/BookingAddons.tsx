import Image from 'next/image';
import React from 'react';

interface ServiceAddon {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  addons?: ServiceAddon[];
}

export default function BookingAddons({
  service,
  selectedAddonIds,
  onAddonChange,
}: {
  service: Service;
  selectedAddonIds: string[];
  onAddonChange: (ids: string[]) => void;
}) {
  if (!service.addons || service.addons.length === 0) return null;

  return (
    <div className="mb-6 p-3 bg-crm-bg rounded-lg border border-crm-border shadow-sm">
      <p className="text-crm-text text-[12px] font-semibold mb-2">Enhance your service:</p>
      <div className="space-y-2">
        {service.addons.map(addon => {
          const isSelected = selectedAddonIds.includes(addon.id);
          return (
            <label key={addon.id} className={`flex items-center justify-between p-2 rounded border cursor-pointer transition-colors ${isSelected ? 'bg-crm-primary/10 border-crm-primary/50' : 'bg-crm-surface border-crm-border hover:border-crm-primary/30'}`}>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) onAddonChange([...selectedAddonIds, addon.id]);
                    else onAddonChange(selectedAddonIds.filter(id => id !== addon.id));
                  }}
                  className="w-4 h-4 accent-crm-primary rounded border-crm-border"
                />
                <span className="text-crm-text text-[13px]">{addon.name}</span>
              </div>
              <span className="text-crm-muted text-[12px] whitespace-nowrap">
                +${addon.price.toFixed(2)} {addon.durationMin > 0 ? ` (+${addon.durationMin}m)` : ''}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
