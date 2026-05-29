'use client';

import { useState, useEffect } from 'react';
import { fmtPrice } from '@/lib/formatters';
import MediaPicker from './MediaPicker';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';
import { ServiceForm } from './services/ServiceForm';
import { ServiceList } from './services/ServiceList';

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
 type: 'CUSTOMER' | 'INTERNAL';
 isBookable: boolean;
 imageUrl: string | null;
 addons?: ServiceAddon[];
 resourceRequirements?: { id: string, resourceType: string, quantity: number }[];
 productUsages?: { id: string, productId: string, servicesPerProduct: number, product: { name: string } }[];
}

interface ServiceManagementProps {
 shopId: string;
 currency: string;
}

export function ServiceManagement({ shopId, currency }: ServiceManagementProps) {
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
 setNewService({ name: '', description: '', price: '', duration: '', type: 'CUSTOMER', addonIds: [], isBookable: true, imageUrl: '', resourceRequirements: [], productUsages: [] });
 setEditingServiceId(null);
 };

 const handleEditClick = (service: Service) => {
 setEditingServiceId(service.id);
 setNewService({
 name: service.name,
 description: service.description || '',
 price: service.price.toString(),
 duration: service.duration.toString(),
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
 <div className="w-full space-y-6 sm:space-y-8 relative">
 {/* Premium Radial Glows */}
 <div className="absolute top-0 left-1/4 w-96 h-96 bg-crm-primary/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
 <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-brand-indigo/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

 <div>
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
        <ServiceForm
          newService={newService}
          setNewService={setNewService}
          isSubmitting={isSubmitting}
          editingServiceId={editingServiceId}
          allAddons={allAddons}
          resources={resources}
          products={products}
          shopId={shopId}
          currency={currency}
          onSubmit={handleSubmitService}
          onReset={resetForm}
        />

        {/* Services List */}
        <ServiceList
          services={services}
          allAddons={allAddons}
          currency={currency}
          onEdit={handleEditClick}
          onToggleBookable={handleToggleBookable}
          onToggleAddon={handleToggleAddon}
          onDelete={handleDeleteService}
        />
      </div>

      {/* Info Box */}
      <div className="bg-status-info/10 border border-status-info/30 rounded-lg p-4 mt-6">
        <h4 className="text-status-info font-semibold mb-2 text-base">ℹ️ Service Management Tips</h4>
        <ul className="text-[13px] text-status-info space-y-1">
          <li>• <strong>Customer-Facing Services</strong> are displayed on your public shop page for booking.</li>
          <li>• <strong>Internal Services</strong> are hidden from the public page, used for tracking inventory or add-ons.</li>
          <li>• Customers will see the service name, price, and duration.</li>
        </ul>
      </div>
    </div>
  );
}
