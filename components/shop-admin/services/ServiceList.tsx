import Image from 'next/image';
import React from 'react';
import { fmtPrice } from '@/lib/formatters';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumBadge from '@/components/ui/PremiumBadge';

export function ServiceList({
  services,
  allAddons,
  currency,
  onEdit,
  onToggleBookable,
  onToggleAddon,
  onDelete
}: any) {
  if (services.length === 0) {
    return (
      <div>
        <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Current Services</h3>
        <PremiumGlassCard className="text-center">
          <p className="text-crm-muted text-[13px]">No services added yet. Create one above to get started!</p>
        </PremiumGlassCard>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Current Services</h3>
      <div className="space-y-3">
        {services.map((service: any) => (
          <PremiumGlassCard
            key={service.id}
            className="!p-3 sm:!p-4"
            accentColor={service.type === 'INTERNAL' ? 'crm-primary' : 'emerald-500'}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0 flex gap-4">
                {service.imageUrl && (
                  <Image src={service.imageUrl} alt={service.name} />
                )}
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <button onClick={() => onEdit(service)} className="text-left hover:text-crm-primary transition-colors focus:outline-none">
                      <h4 className="font-semibold text-crm-text text-base hover:text-crm-primary">{service.name}</h4>
                    </button>
                    
                    <PremiumBadge variant={service.type === 'INTERNAL' ? 'warning' : 'success'}>
                      {service.type}
                    </PremiumBadge>

                    <button onClick={() => onToggleBookable(service)}>
                      <PremiumBadge variant={service.isBookable ? 'success' : 'error'}>
                        Consumer: {service.isBookable ? 'ON' : 'OFF'}
                      </PremiumBadge>
                    </button>
                  </div>
                  {service.description && (
                    <p className="text-crm-muted mt-1 text-[13px]">{service.description}</p>
                  )}
                  {service.productUsages && service.productUsages.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {service.productUsages.map((pu: any) => (
                        <span key={pu.id} className="text-[11px] bg-crm-surface border border-crm-border text-crm-muted px-2 py-0.5 rounded">
                          Uses 1 <b>{pu.product?.name}</b> per {pu.servicesPerProduct} services
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 sm:gap-6 mt-2 text-[11px] sm:text-[13px] text-crm-muted">
                    <span>💰 {fmtPrice(service.price, currency)}</span>
                    <span>⏱️ {service.duration} minutes</span>
                  </div>
                  
                  {/* Add-ons Selector */}
                  {allAddons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-crm-border">
                      <p className="text-[13px] font-semibold text-crm-text mb-2">Available Add-Ons:</p>
                      <div className="flex flex-wrap gap-2">
                        {allAddons.map((addon: any) => {
                          const currentAddonIds = service.addons?.map((a: any) => a.id) || [];
                          const isSelected = currentAddonIds.includes(addon.id);
                          
                          return (
                            <button
                              key={addon.id}
                              onClick={() => onToggleAddon(service.id, addon.id, currentAddonIds)}
                              className={`text-[11px] sm:text-[12px] px-2 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                                isSelected 
                                  ? 'bg-crm-primary/20 border-crm-primary text-crm-primary' 
                                  : 'bg-crm-bg border-crm-border text-crm-muted hover:border-crm-primary/50'
                              }`}
                            >
                              {isSelected && <span>✓</span>}
                              {addon.name} (+{fmtPrice(addon.price, currency)})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <PremiumButton
                onClick={() => onDelete(service.id, service.name)}
                variant="danger"
                className="self-start mt-2 sm:mt-0"
              >
                Delete
              </PremiumButton>
            </div>
          </PremiumGlassCard>
        ))}
      </div>
    </div>
  );
}
