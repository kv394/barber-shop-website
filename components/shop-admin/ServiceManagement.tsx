'use client';

import { useState, useEffect } from 'react';

interface ServiceAddon {
  id: string;
  name: string;
  price: number;
  durationMin: number;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  trackInventory: boolean;
  type: 'CUSTOMER' | 'INTERNAL';
  addons?: ServiceAddon[];
}

interface ServiceManagementProps {
  shopId: string;
}

export function ServiceManagement({ shopId }: ServiceManagementProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [allAddons, setAllAddons] = useState<ServiceAddon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    trackInventory: false,
    type: 'CUSTOMER' as 'CUSTOMER' | 'INTERNAL',
    addonIds: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  // Fetch services and addons
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, addonsRes] = await Promise.all([
          fetch(`/api/shops/${shopId}/services`),
          fetch(`/api/shops/${shopId}/services/addons`)
        ]);

        if (!servicesRes.ok || !addonsRes.ok) throw new Error('Failed to fetch data');
        
        const servicesData = await servicesRes.json();
        const addonsData = await addonsRes.json();
        
        setServices(Array.isArray(servicesData) ? servicesData : []);
        setAllAddons(Array.isArray(addonsData) ? addonsData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!newService.name.trim()) {
        throw new Error('Service name is required');
      }
      if (!newService.price || parseFloat(newService.price) < 0) {
        throw new Error('Valid price is required');
      }
      if (!newService.duration || parseInt(newService.duration) <= 0) {
        throw new Error('Duration must be greater than 0');
      }

      const response = await fetch(`/api/shops/${shopId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newService.name,
          description: newService.description || null,
          price: parseFloat(newService.price),
          duration: parseInt(newService.duration),
          trackInventory: newService.trackInventory,
          type: newService.type,
          addonIds: newService.addonIds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add service');
      }

      const addedService = await response.json();
      setServices([...services, addedService]);
      setNewService({ name: '', description: '', price: '', duration: '', trackInventory: false, type: 'CUSTOMER', addonIds: [] });
      setSuccess(`Service "${newService.name}" added successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${serviceName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/shops/${shopId}/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete service');
      }

      setServices(services.filter((s) => s.id !== serviceId));
      setSuccess(`Service deleted successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleToggleAddon = async (serviceId: string, addonId: string, currentAddonIds: string[]) => {
    try {
      const newAddonIds = currentAddonIds.includes(addonId)
        ? currentAddonIds.filter(id => id !== addonId)
        : [...currentAddonIds, addonId];
      
      const response = await fetch(`/api/shops/${shopId}/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addonIds: newAddonIds })
      });

      if (!response.ok) throw new Error('Failed to update service addons');
      
      const updated = await response.json();
      // Since our API endpoint might not return the fully populated addons array, we can just update local state manually
      setServices(services.map(s => {
        if (s.id === serviceId) {
          return {
            ...s,
            addons: allAddons.filter(a => newAddonIds.includes(a.id))
          };
        }
        return s;
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update addons');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-crm-muted text-[13px]">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div>
        <h2 className="font-bold text-crm-text mb-4 sm:mb-6 text-xl font-bold">Manage Services</h2>

        {error && (
          <div className="bg-status-cancelled/10 border border-status-cancelled text-status-cancelled p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-[13px]">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-status-confirmed/10 border border-status-confirmed text-status-confirmed p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-[13px]">
            {success}
          </div>
        )}

        {/* Add Service Form */}
        <div className="bg-crm-surface p-4 sm:p-6 rounded-lg border border-crm-border shadow-sm mb-6 sm:mb-8">
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Add New Service</h3>
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-crm-muted mb-2 text-[13px]">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g., Haircut, Shave, Beard Trim"
                  required
                  className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block font-medium text-crm-muted mb-2 text-[13px]">
                  Duration (minutes) *
                </label>
                <input
                  type="text"
                  value={newService.duration}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d+$/.test(val)) setNewService({ ...newService, duration: val });
                  }}
                  placeholder="30"
                  required
                  className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block font-medium text-crm-muted mb-2 text-[13px]">
                  Price ($) *
                </label>
                <input
                  type="text"
                  value={newService.price}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d*$/.test(val)) setNewService({ ...newService, price: val });
                  }}
                  placeholder="25.00"
                  required
                  className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block font-medium text-crm-muted mb-2 text-[13px]">
                  Service Type *
                </label>
                <select
                  value={newService.type}
                  onChange={(e) => setNewService({ ...newService, type: e.target.value as 'CUSTOMER' | 'INTERNAL' })}
                  className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text"
                >
                  <option value="CUSTOMER">Customer-Facing Service</option>
                  <option value="INTERNAL">Internal / Add-on Service</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block font-medium text-crm-muted mb-2 text-[13px]">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Brief description of the service"
                  className="w-full bg-crm-bg border border-crm-border shadow-sm rounded px-4 py-2 text-crm-text placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 py-2">
              <input 
                type="checkbox" 
                id="trackInventory" 
                checked={newService.trackInventory} 
                onChange={(e) => setNewService({ ...newService, trackInventory: e.target.checked })}
                className="w-4 h-4 accent-blue-600 bg-crm-bg border-crm-border rounded"
              />
              <label htmlFor="trackInventory" className="text-crm-muted cursor-pointer select-none text-[13px]">
                Enable Inventory Tracking for this service (e.g., track hair products used)
              </label>
            </div>

            {allAddons.length > 0 && (
              <div className="bg-crm-bg p-4 rounded border border-crm-border">
                <label className="block font-medium text-crm-text mb-3 text-[13px]">
                  Select Available Add-Ons for this Service
                </label>
                <div className="flex flex-wrap gap-2">
                  {allAddons.map(addon => {
                    const isSelected = newService.addonIds.includes(addon.id);
                    return (
                      <button
                        type="button"
                        key={addon.id}
                        onClick={() => {
                          setNewService(prev => ({
                            ...prev,
                            addonIds: isSelected 
                              ? prev.addonIds.filter(id => id !== addon.id)
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
                        {addon.name} (+${addon.price})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !newService.name || !newService.price || !newService.duration}
              className="w-full bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 disabled:opacity-50 font-bold py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Adding Service...' : 'Add Service'}
            </button>
          </form>
        </div>

        {/* Services List */}
        <div>
          <h3 className="font-bold text-crm-text mb-4 text-lg font-bold">Current Services</h3>
          {services.length === 0 ? (
            <div className="bg-crm-surface p-8 rounded-lg border border-crm-border shadow-sm text-center">
              <p className="text-crm-muted text-[13px]">No services added yet. Create one above to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-crm-surface p-3 sm:p-4 rounded-lg border border-crm-border shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h4 className="font-semibold text-crm-text text-base font-semibold">{service.name}</h4>
                          <div className={`text-[13px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded border ${service.type === 'INTERNAL' ? 'bg-crm-accent/20 text-crm-accent border-crm-accent/30' : 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30'}`}>
                              {service.type}
                          </div>
                          <div className={`text-[13px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded border ${service.trackInventory ? 'bg-status-info/20 text-status-info border-status-info/30' : 'bg-crm-surface text-crm-muted border-crm-border'}`}>
                              Inventory: {service.trackInventory ? 'ON' : 'OFF'}
                          </div>
                      </div>
                      {service.description && (
                        <p className="text-crm-muted mt-1 text-[13px]">{service.description}</p>
                      )}
                      <div className="flex gap-4 sm:gap-6 mt-2 text-[11px] sm:text-[13px] text-crm-muted">
                        <span>💰 ${service.price.toFixed(2)}</span>
                        <span>⏱️ {service.duration} minutes</span>
                      </div>
                      
                      {/* Add-ons Selector */}
                      {allAddons.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-crm-border">
                          <p className="text-[13px] font-semibold text-crm-text mb-2">Available Add-Ons:</p>
                          <div className="flex flex-wrap gap-2">
                            {allAddons.map(addon => {
                              const currentAddonIds = service.addons?.map(a => a.id) || [];
                              const isSelected = currentAddonIds.includes(addon.id);
                              
                              return (
                                <button
                                  key={addon.id}
                                  onClick={() => handleToggleAddon(service.id, addon.id, currentAddonIds)}
                                  className={`text-[11px] sm:text-[12px] px-2 py-1 rounded-full border transition-colors flex items-center gap-1 ${
                                    isSelected 
                                      ? 'bg-crm-primary/20 border-crm-primary text-crm-primary' 
                                      : 'bg-crm-bg border-crm-border text-crm-muted hover:border-crm-primary/50'
                                  }`}
                                >
                                  {isSelected && <span>✓</span>}
                                  {addon.name} (+${addon.price})
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteService(service.id, service.name)}
                      className="bg-status-cancelled/20 hover:bg-status-cancelled/40 text-status-cancelled px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-[11px] sm:text-[13px] shrink-0 self-start"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-status-info/10 border border-status-info/30 rounded-lg p-4 mt-6">
          <h4 className="text-status-info font-semibold mb-2 text-base font-semibold">ℹ️ Service Management Tips</h4>
          <ul className="text-[13px] text-status-info space-y-1">
            <li>• <strong>Customer-Facing Services</strong> are displayed on your public shop page for booking.</li>
            <li>• <strong>Internal Services</strong> are hidden from the public page, used for tracking inventory or add-ons.</li>
            <li>• Customers will see the service name, price, and duration.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
