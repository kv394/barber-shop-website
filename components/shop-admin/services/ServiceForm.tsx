import Image from 'next/image';
import React from 'react';
import { fmtPrice } from '@/lib/formatters';
import MediaPicker from '../MediaPicker';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumInput from '@/components/ui/PremiumInput';

export function ServiceForm({
  newService,
  setNewService,
  isSubmitting,
  editingServiceId,
  allAddons,
  resources,
  products,
  shopId,
  currency,
  onSubmit,
  onReset
}: any) {
  return (
    <PremiumGlassCard className="mb-6 sm:mb-8" accentColor="crm-primary">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-crm-text text-xl flex items-center gap-3">
          {editingServiceId ? '✏️ Edit Service' : '✨ Add New Service'}
        </h3>
        {editingServiceId && (
          <PremiumButton onClick={onReset} variant="secondary">
            Cancel Edit
          </PremiumButton>
        )}
      </div>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PremiumInput
            label="Service Name *"
            value={newService.name}
            onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            placeholder="e.g., Haircut, Shave, Beard Trim"
            required
          />

          <PremiumInput
            label="Duration (minutes) *"
            value={newService.duration}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d+$/.test(val)) setNewService({ ...newService, duration: val });
            }}
            placeholder="30"
            required
          />

          <PremiumInput
            label="Price ($) *"
            value={newService.price}
            onChange={(e) => {
              const val = e.target.value;
              if (val === '' || /^\d*\.?\d*$/.test(val)) setNewService({ ...newService, price: val });
            }}
            placeholder="25.00"
            required
          />
          
          <div className="space-y-1.5">
            <label htmlFor="service-type" className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">Service Type *</label>
            <select id="service-type"
              value={newService.type}
              onChange={(e) => setNewService({ ...newService, type: e.target.value as 'CUSTOMER' | 'INTERNAL' })}
              className="w-full bg-crm-bg/50 backdrop-blur-sm border border-white/10 shadow-inner rounded-xl px-4 py-3 text-crm-text focus:ring-2 focus:ring-crm-primary transition-all focus:border-transparent outline-none appearance-none"
            >
              <option value="CUSTOMER">Customer-Facing Service</option>
              <option value="INTERNAL">Internal / Add-on Service</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <PremiumInput
              label="Description (optional)"
              value={newService.description}
              onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              placeholder="Brief description of the service"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3 py-2 cursor-pointer group">
          <div className="relative flex items-center justify-center w-5 h-5">
            <input 
              type="checkbox" 
              id="isBookable" 
              checked={newService.isBookable} 
              onChange={(e) => setNewService({ ...newService, isBookable: e.target.checked })}
              className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-crm-bg/50 checked:bg-crm-primary checked:border-crm-primary transition-all cursor-pointer"
            />
            <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <label htmlFor="isBookable" className="font-medium text-crm-text group-hover:text-crm-primary transition-colors text-[14px] cursor-pointer">
            Available to Customer (Sellable/Bookable)
          </label>
        </div>
        <div className="flex items-center space-x-3 py-2 cursor-pointer group">
          <div className="relative flex items-center justify-center w-5 h-5">
            <input 
              type="checkbox" 
              id="requiresVirtualConsultation" 
              checked={newService.requiresVirtualConsultation} 
              onChange={(e) => setNewService({ ...newService, requiresVirtualConsultation: e.target.checked })}
              className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-crm-bg/50 checked:bg-crm-primary checked:border-crm-primary transition-all cursor-pointer"
            />
            <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <label htmlFor="requiresVirtualConsultation" className="font-medium text-crm-text group-hover:text-crm-primary transition-colors text-[14px] cursor-pointer">
            Requires Virtual Consultation
          </label>
        </div>

        <div className="md:col-span-2">
            <label htmlFor="service-image" className="block font-medium text-crm-muted mb-2 text-[13px]">Service Image (optional)</label>
            <MediaPicker id="service-image" shopId={shopId} currentUrl={newService.imageUrl} onSelect={(url) => setNewService({ ...newService, imageUrl: url })} label="Upload/Select Service Image" />
        </div>

        {allAddons.length > 0 && ( 
          <div className="bg-crm-bg p-4 rounded border border-crm-border">
            <p className="block font-medium text-crm-text mb-3 text-[13px]">
              Select Available Add-Ons for this Service
            </p>
            <div className="flex flex-wrap gap-2">
              {allAddons.map((addon: any) => {
                const isSelected = newService.addonIds.includes(addon.id);
                return (
                  <button
                    type="button"
                    key={addon.id}
                    onClick={() => {
                      setNewService((prev: any) => ({
                        ...prev,
                        addonIds: isSelected 
                          ? prev.addonIds.filter((id: string) => id !== addon.id)
                          : [...prev.addonIds, addon.id]
                      }));
                    }}
                    className={`text-[12px] px-3 py-1.5 rounded-full border transition-colors flex items-center gap-2 ${
                      isSelected 
                        ? 'bg-crm-primary border-crm-primary text-white font-semibold shadow-sm' 
                        : 'bg-crm-surface border-crm-border text-crm-muted hover:border-crm-primary/50'
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

        <div className="bg-crm-bg p-4 rounded border border-crm-border">
          <div className="flex justify-between items-center mb-3">
            <p className="block font-medium text-crm-text text-[13px]">Resource Requirements (Optional)</p>
            <button
              type="button"
              onClick={() => setNewService((prev: any) => ({
                ...prev,
                resourceRequirements: [...prev.resourceRequirements, { resourceType: '', quantity: 1 }]
              }))}
              className="text-[11px] font-bold text-crm-primary"
            >
              + Add Requirement
            </button>
          </div>
          <p className="text-[11px] text-crm-muted mb-3">Does this service require a specific physical resource to be available (e.g., Pedicure Chair)?</p>
          
          {newService.resourceRequirements.length === 0 ? (
            <p className="text-[12px] text-crm-muted italic">No resources required.</p>
          ) : (
            <div className="space-y-2">
              {newService.resourceRequirements.map((req: any, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={req.resourceType}
                    onChange={e => {
                      const newReqs = [...newService.resourceRequirements];
                      newReqs[index].resourceType = e.target.value;
                      setNewService({ ...newService, resourceRequirements: newReqs });
                    }}
                    className="flex-1 bg-crm-surface border border-crm-border text-[13px] rounded p-1.5 text-crm-text"
                  >
                    <option value="">Select Resource Type...</option>
                    {Array.from(new Set(resources.map((r: any) => r.type))).map((type: any) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={req.quantity}
                    onChange={e => {
                      const newReqs = [...newService.resourceRequirements];
                      newReqs[index].quantity = parseInt(e.target.value) || 1;
                      setNewService({ ...newService, resourceRequirements: newReqs });
                    }}
                    className="w-16 bg-crm-surface border border-crm-border text-[13px] rounded p-1.5 text-crm-text text-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newReqs = [...newService.resourceRequirements];
                      newReqs.splice(index, 1);
                      setNewService({ ...newService, resourceRequirements: newReqs });
                    }}
                    className="text-status-cancelled text-lg font-bold px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-crm-bg p-4 rounded border border-crm-border">
          <div className="flex justify-between items-center mb-3">
            <p className="block font-medium text-crm-text text-[13px]">
              Product Inventory Usage (Optional)
            </p>
            <button
              type="button"
              onClick={() => setNewService((prev: any) => ({
                ...prev,
                productUsages: [...prev.productUsages, { productId: '', servicesPerProduct: 1 }]
              }))}
              className="text-[11px] font-bold text-crm-primary"
            >
              + Add Product Usage
            </button>
          </div>
          <p className="text-[11px] text-crm-muted mb-3">Automatically deduct inventory for products after a certain number of services are completed.</p>
          
          {newService.productUsages.length === 0 ? (
            <p className="text-[12px] text-crm-muted italic">No products mapped.</p>
          ) : (
            <div className="space-y-2">
              {newService.productUsages.map((usage: any, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <select
                    value={usage.productId}
                    onChange={e => {
                      const newUsages = [...newService.productUsages];
                      newUsages[index].productId = e.target.value;
                      setNewService({ ...newService, productUsages: newUsages });
                    }}
                    className="flex-1 bg-crm-surface border border-crm-border text-[13px] rounded p-1.5 text-crm-text"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.inventoryCount} in stock)</option>
                    ))}
                  </select>
                  <span className="text-[12px] text-crm-muted">deduct 1 per</span>
                  <input
                    type="number"
                    min="1"
                    value={usage.servicesPerProduct}
                    onChange={e => {
                      const newUsages = [...newService.productUsages];
                      newUsages[index].servicesPerProduct = parseInt(e.target.value) || 1;
                      setNewService({ ...newService, productUsages: newUsages });
                    }}
                    className="w-16 bg-crm-surface border border-crm-border text-[13px] rounded p-1.5 text-crm-text text-center"
                  />
                  <span className="text-[12px] text-crm-muted">services</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newUsages = [...newService.productUsages];
                      newUsages.splice(index, 1);
                      setNewService({ ...newService, productUsages: newUsages });
                    }}
                    className="text-status-cancelled text-lg font-bold px-2"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <PremiumButton
          type="submit"
          disabled={isSubmitting || !newService.name || !newService.price || !newService.duration}
          className="w-full mt-4"
        >
          {isSubmitting 
            ? (editingServiceId ? 'Updating Service...' : 'Adding Service...') 
            : (editingServiceId ? 'Update Service' : 'Add Service')}
        </PremiumButton>
      </form>
    </PremiumGlassCard>
  );
}
