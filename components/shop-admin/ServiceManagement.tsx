'use client';

import { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  trackInventory: boolean;
  type: 'CUSTOMER' | 'INTERNAL';
}

interface ServiceManagementProps {
  shopId: string;
}

export function ServiceManagement({ shopId }: ServiceManagementProps) {
  const [services, setServices] = useState<Service[]>([]);
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`/api/shops/${shopId}/services`);
        if (!response.ok) throw new Error('Failed to fetch services');
        const data = await response.json();
        setServices(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add service');
      }

      const addedService = await response.json();
      setServices([...services, addedService]);
      setNewService({ name: '', description: '', price: '', duration: '', trackInventory: false, type: 'CUSTOMER' });
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

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-botanical-muted">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-botanical-text mb-4 sm:mb-6">Manage Services</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 text-sm">
            {success}
          </div>
        )}

        {/* Add Service Form */}
        <div className="bg-botanical-surface p-4 sm:p-6 rounded-lg border-2 border-b-[6px] border-botanical-border mb-6 sm:mb-8">
          <h3 className="text-lg font-bold text-botanical-text mb-4">Add New Service</h3>
          <form onSubmit={handleAddService} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-botanical-muted mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="e.g., Haircut, Shave, Beard Trim"
                  required
                  className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-botanical-muted mb-2">
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
                  className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-botanical-muted mb-2">
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
                  className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-botanical-muted mb-2">
                  Service Type *
                </label>
                <select
                  value={newService.type}
                  onChange={(e) => setNewService({ ...newService, type: e.target.value as 'CUSTOMER' | 'INTERNAL' })}
                  className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text"
                >
                  <option value="CUSTOMER">Customer-Facing Service</option>
                  <option value="INTERNAL">Internal / Add-on Service</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-botanical-muted mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Brief description of the service"
                  className="w-full bg-botanical-bg border-2 border-b-[6px] border-botanical-border rounded px-4 py-2 text-botanical-text placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 py-2">
              <input 
                type="checkbox" 
                id="trackInventory" 
                checked={newService.trackInventory} 
                onChange={(e) => setNewService({ ...newService, trackInventory: e.target.checked })}
                className="w-4 h-4 accent-blue-600 bg-botanical-bg border-botanical-border rounded"
              />
              <label htmlFor="trackInventory" className="text-sm text-botanical-muted cursor-pointer select-none">
                Enable Inventory Tracking for this service (e.g., track hair products used)
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !newService.name || !newService.price || !newService.duration}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Adding Service...' : 'Add Service'}
            </button>
          </form>
        </div>

        {/* Services List */}
        <div>
          <h3 className="text-lg font-bold text-botanical-text mb-4">Current Services</h3>
          {services.length === 0 ? (
            <div className="bg-botanical-surface p-8 rounded-lg border-2 border-b-[6px] border-botanical-border text-center">
              <p className="text-botanical-muted">No services added yet. Create one above to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-botanical-surface p-3 sm:p-4 rounded-lg border-2 border-b-[6px] border-botanical-border"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                          <h4 className="font-semibold text-botanical-text text-sm sm:text-lg">{service.name}</h4>
                          <div className={`text-sm sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded border ${service.type === 'INTERNAL' ? 'bg-purple-900/50 text-purple-300 border-purple-500/30' : 'bg-green-900/50 text-green-300 border-green-500/30'}`}>
                              {service.type}
                          </div>
                          <div className={`text-sm sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded border ${service.trackInventory ? 'bg-blue-900/50 text-blue-300 border-blue-500/30' : 'bg-botanical-surface text-botanical-muted border-botanical-border'}`}>
                              Inventory: {service.trackInventory ? 'ON' : 'OFF'}
                          </div>
                      </div>
                      {service.description && (
                        <p className="text-botanical-muted text-xs sm:text-sm mt-1">{service.description}</p>
                      )}
                      <div className="flex gap-4 sm:gap-6 mt-2 text-xs sm:text-sm text-botanical-muted">
                        <span>💰 ${service.price.toFixed(2)}</span>
                        <span>⏱️ {service.duration} minutes</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteService(service.id, service.name)}
                      className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm shrink-0 self-start"
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
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
          <h4 className="text-blue-400 font-semibold mb-2">ℹ️ Service Management Tips</h4>
          <ul className="text-sm text-blue-300 space-y-1">
            <li>• <strong>Customer-Facing Services</strong> are displayed on your public shop page for booking.</li>
            <li>• <strong>Internal Services</strong> are hidden from the public page, used for tracking inventory or add-ons.</li>
            <li>• Customers will see the service name, price, and duration.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
