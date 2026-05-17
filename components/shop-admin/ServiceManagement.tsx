'use client';

import { useState, useEffect } from 'react';
import MediaPicker from './MediaPicker';

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
  isBookable: boolean;
  imageUrl: string | null;
  addons?: ServiceAddon[];
  resourceRequirements?: { id: string, resourceType: string, quantity: number }[];
  productUsages?: { id: string, productId: string, servicesPerProduct: number, product: { name: string } }[];
}

interface ServiceManagementProps {
  shopId: string;
}

export function ServiceManagement({ shopId }: ServiceManagementProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [allAddons, setAllAddons] = useState<ServiceAddon[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
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
    isBookable: true,
    imageUrl: '',
    resourceRequirements: [] as { resourceType: string, quantity: number }[],
    productUsages: [] as { productId: string, servicesPerProduct: number }[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'services');
      const res = await fetch(`/api/shops/${shopId}/upload`, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNewService(prev => ({ ...prev, imageUrl: data.url }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch services and addons
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, addonsRes, resourcesRes, productsRes] = await Promise.all([
          fetch(`/api/shops/${shopId}/services?admin=true`),
          fetch(`/api/shops/${shopId}/services/addons`),
          fetch(`/api/shops/${shopId}/resources`),
          fetch(`/api/shops/${shopId}/products`)
        ]);

        if (!servicesRes.ok || !addonsRes.ok || !resourcesRes.ok || !productsRes.ok) throw new Error('Failed to fetch data');
        
        const servicesData = await servicesRes.json();
        const addonsData = await addonsRes.json();
        const resourcesData = await resourcesRes.json();
        const productsData = await productsRes.json();
        
        setServices(Array.isArray(servicesData) ? servicesData : []);
        setAllAddons(Array.isArray(addonsData) ? addonsData : []);
        setResources(Array.isArray(resourcesData) ? resourcesData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  const resetForm = () => {
    setNewService({ name: '', description: '', price: '', duration: '', trackInventory: false, type: 'CUSTOMER', addonIds: [], isBookable: true, imageUrl: '', resourceRequirements: [], productUsages: [] });
    setEditingServiceId(null);
  };

  const handleEditClick = (service: Service) => {
    setEditingServiceId(service.id);
    setNewService({
      name: service.name,
      description: service.description || '',
      price: service.price.toString(),
      duration: service.duration.toString(),
      trackInventory: service.trackInventory,
      type: service.type,
      addonIds: service.addons?.map(a => a.id) || [],
      isBookable: service.isBookable,
      imageUrl: service.imageUrl || '',
      resourceRequirements: service.resourceRequirements?.map(r => ({ resourceType: r.resourceType, quantity: r.quantity })) || [],
      productUsages: service.productUsages?.map(p => ({ productId: p.productId, servicesPerProduct: p.servicesPerProduct })) || [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitService = async (e: React.FormEvent) => {
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

      const method = editingServiceId ? 'PUT' : 'POST';
      const url = editingServiceId 
        ? `/api/shops/${shopId}/services/${editingServiceId}`
        : `/api/shops/${shopId}/services`;

      const response = await fetch(url, {
        method: method,
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
          isBookable: newService.isBookable,
          imageUrl: newService.imageUrl,
          addonIds: newService.addonIds,
          resourceRequirements: newService.resourceRequirements,
          productUsages: newService.productUsages,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${editingServiceId ? 'update' : 'add'} service`);
      }

      const savedService = await response.json();
      
      if (editingServiceId) {
        setServices(services.map(s => s.id === editingServiceId ? savedService : s));
        setSuccess(`Service "${savedService.name}" updated successfully!`);
      } else {
        setServices([...services, savedService]);
        setSuccess(`Service "${savedService.name}" added successfully!`);
      }
      
      resetForm();
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

  
  const handleToggleBookable = async (service: any) => {
    try {
      const res = await fetch(`/api/shops/${shopId}/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...service, addonIds: service.addons?.map((a: any) => a.id) || [], isBookable: !service.isBookable }),
      });
      if (!res.ok) throw new Error('Failed to toggle bookable status');
      
      setServices(services.map(s => s.id === service.id ? { ...s, isBookable: !s.isBookable } : s));
    } catch (err: any) {
      alert(err.message);
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-crm-text text-lg font-bold">
              {editingServiceId ? 'Edit Service' : 'Add New Service'}
            </h3>
            {editingServiceId && (
              <button 
                type="button" 
                onClick={resetForm}
                className="text-[13px] text-crm-muted hover:text-crm-text transition-colors border border-crm-border px-3 py-1 rounded-md"
              >
                Cancel Edit
              </button>
            )}
          </div>
          <form onSubmit={handleSubmitService} className="space-y-4">
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
                id="isBookable" 
                checked={newService.isBookable} 
                onChange={(e) => setNewService({ ...newService, isBookable: e.target.checked })}
                className="w-4 h-4 accent-blue-600 bg-crm-bg border-crm-border rounded"
              />
              <label htmlFor="isBookable" className="text-crm-muted cursor-pointer select-none text-[13px]">
                Available to Customer (Sellable/Bookable)
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block font-medium text-crm-muted mb-2 text-[13px]">
                Service Image (optional)
              </label>
              <MediaPicker shopId={shopId} currentUrl={newService.imageUrl} onSelect={(url) => setNewService({ ...newService, imageUrl: url })} label="Upload/Select Service Image" />
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

            <div className="bg-crm-bg p-4 rounded border border-crm-border">
              <div className="flex justify-between items-center mb-3">
                <label className="block font-medium text-crm-text text-[13px]">
                  Resource Requirements (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setNewService(prev => ({
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
                  {newService.resourceRequirements.map((req, index) => (
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
                        {/* We will just use the unique types from existing resources, or list them all. For simplicity, let's use the names or types. Actually, the backend uses `resourceType`, which maps to Resource.type. */}
                        {Array.from(new Set(resources.map(r => r.type))).map(type => (
                           <option key={type as string} value={type as string}>{type as string}</option>
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
                <label className="block font-medium text-crm-text text-[13px]">
                  Product Inventory Usage (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setNewService(prev => ({
                    ...prev,
                    productUsages: [...prev.productUsages, { productId: '', servicesPerProduct: 1 }]
                  }))}
                  className="text-[11px] font-bold text-crm-primary"
                >
                  + Add Product Usage
                </button>
              </div>
              <p className="text-[11px] text-crm-muted mb-3">Automatically deduct inventory for products after a certain number of services are completed (e.g., 1 bottle of shampoo used per 20 haircuts).</p>
              
              {newService.productUsages.length === 0 ? (
                <p className="text-[12px] text-crm-muted italic">No products mapped.</p>
              ) : (
                <div className="space-y-2">
                  {newService.productUsages.map((usage, index) => (
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
                        {products.map(p => (
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

            <button
              type="submit"
              disabled={isSubmitting || !newService.name || !newService.price || !newService.duration}
              className="w-full bg-crm-primary text-white hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 disabled:opacity-50 font-bold py-2 rounded-lg transition-colors"
            >
              {isSubmitting 
                ? (editingServiceId ? 'Updating Service...' : 'Adding Service...') 
                : (editingServiceId ? 'Update Service' : 'Add Service')}
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
                    <div className="flex-1 min-w-0 flex gap-4">
                      {service.imageUrl && (
                        <img src={service.imageUrl} alt={service.name} className="w-16 h-16 object-cover rounded-lg border border-crm-border hidden sm:block" />
                      )}
                      <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                          <button onClick={() => handleEditClick(service)} className="text-left hover:text-crm-primary transition-colors focus:outline-none">
                            <h4 className="font-semibold text-crm-text text-base font-semibold hover:text-crm-primary">{service.name}</h4>
                          </button>
                          <div className={`text-[13px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded border ${service.type === 'INTERNAL' ? 'bg-crm-accent/20 text-crm-accent border-crm-accent/30' : 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30'}`}>
                              {service.type}
                          </div>
                          <div className={`text-[13px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded border ${service.trackInventory ? 'bg-status-info/20 text-status-info border-status-info/30' : 'bg-crm-surface text-crm-muted border-crm-border'}`}>
                              Inventory: {service.trackInventory ? 'ON' : 'OFF'}
                          </div>
                          <button
                            onClick={() => handleToggleBookable(service)}
                            className={`text-[13px] sm:text-[11px] font-semibold px-2 py-0.5 sm:py-1 rounded border transition-colors ${service.isBookable ? 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/30 hover:opacity-80' : 'bg-status-cancelled/20 text-status-cancelled border-status-cancelled/30 hover:opacity-80'}`}
                          >
                            Consumer: {service.isBookable ? 'ON' : 'OFF'}
                          </button>
                      </div>
                      {service.description && (
                        <p className="text-crm-muted mt-1 text-[13px]">{service.description}</p>
                      )}
                      {service.productUsages && service.productUsages.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {service.productUsages.map(pu => (
                            <span key={pu.id} className="text-[11px] bg-crm-surface border border-crm-border text-crm-muted px-2 py-0.5 rounded">
                              Uses 1 <b>{pu.product?.name}</b> per {pu.servicesPerProduct} services
                            </span>
                          ))}
                        </div>
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
