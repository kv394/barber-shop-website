'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import MediaPicker from './MediaPicker';

export default function StaffProfileModalWrapper({ staff, shopId, children }: { staff: any, shopId?: string, children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageUrl, setImageUrl] = useState(staff.imageUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: staff.name || '',
    phone: staff.phone || '',
    canManageInventory: staff.canManageInventory || false,
    employmentType: staff.employmentType || 'W2',
    boothRentAmount: staff.boothRentAmount || '',
    boothRentInterval: staff.boothRentInterval || 'WEEKLY'
  });

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImageUrl(staff.imageUrl);
    setFormData({
      name: staff.name || '',
      phone: staff.phone || '',
      canManageInventory: staff.canManageInventory || false,
      employmentType: staff.employmentType || 'W2',
      boothRentAmount: staff.boothRentAmount || '',
      boothRentInterval: staff.boothRentInterval || 'WEEKLY'
    });
  }, [staff]);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsEditing(false); // reset edit state when opening
    } else {
      const timeout = setTimeout(() => setIsRendered(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  const handleImageUpdate = async (newUrl: string) => {
    setImageUrl(newUrl);
    if (!shopId) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: newUrl })
      });
      if (!res.ok) throw new Error('Failed to update image');
      staff.imageUrl = newUrl;
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!shopId) return;
    setIsSaving(true);
    try {
      const payload: any = { ...formData };
      if (payload.boothRentAmount) {
        payload.boothRentAmount = parseFloat(payload.boothRentAmount);
      } else {
        payload.boothRentAmount = null;
      }
      if (payload.employmentType === 'W2') {
         payload.boothRentAmount = null;
         payload.boothRentInterval = null;
      }

      const res = await fetch(`/api/shops/${shopId}/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      
      staff.name = formData.name;
      staff.phone = formData.phone;
      staff.canManageInventory = formData.canManageInventory;
      staff.employmentType = payload.employmentType;
      staff.boothRentAmount = payload.boothRentAmount;
      staff.boothRentInterval = payload.boothRentInterval;
      
      setIsEditing(false);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const modalContent = (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
      onClick={() => setIsOpen(false)}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div 
        className={`bg-crm-bg border border-crm-border shadow-sm rounded-2xl p-6 w-full max-w-sm shadow-2xl relative transition-all duration-200 flex flex-col max-h-[90vh] ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`} 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={() => setIsOpen(false)} className="absolute top-3 right-4 text-crm-primary bg-white hover:bg-gray-100 shadow-sm z-10 w-7 h-7 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]">
          ✕
        </button>
        
        <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col items-center pt-2 pb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-crm-surface border-2 border-brand-gold mb-3 flex items-center justify-center shrink-0 relative group">
            {imageUrl ? (
              <img src={imageUrl} alt={staff.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl text-crm-muted">👤</span>
            )}
          </div>
          
          {shopId && (
            <div className="mb-4 w-full flex justify-center">
               <MediaPicker 
                 shopId={shopId} 
                 currentUrl={imageUrl} 
                 onSelect={handleImageUpdate} 
                 label={isSaving ? "Saving..." : "Edit Photo"} 
                 className="flex flex-col items-center gap-2"
               />
            </div>
          )}

          {isEditing ? (
             <div className="w-full mb-4 space-y-3">
               <div>
                 <label className="block text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-1">Name</label>
                 <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 text-[13px] bg-crm-surface border border-crm-border rounded" />
               </div>
               <div>
                 <label className="block text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-1">Phone</label>
                 <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 text-[13px] bg-crm-surface border border-crm-border rounded" />
               </div>
               <div>
                 <label className="block text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-1">Employment Type</label>
                 <select value={formData.employmentType} onChange={e => setFormData({...formData, employmentType: e.target.value})} className="w-full p-2 text-[13px] bg-crm-surface border border-crm-border rounded">
                   <option value="W2">W2 Employee</option>
                   <option value="CONTRACTOR">Independent Contractor (Booth Rent)</option>
                 </select>
               </div>
               {formData.employmentType === 'CONTRACTOR' && (
                 <div className="flex gap-2">
                   <div className="flex-1">
                     <label className="block text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-1">Rent Amount</label>
                     <input type="number" value={formData.boothRentAmount} onChange={e => setFormData({...formData, boothRentAmount: e.target.value})} placeholder="0.00" className="w-full p-2 text-[13px] bg-crm-surface border border-crm-border rounded" />
                   </div>
                   <div className="flex-1">
                     <label className="block text-[11px] font-bold text-crm-muted uppercase tracking-wider mb-1">Interval</label>
                     <select value={formData.boothRentInterval} onChange={e => setFormData({...formData, boothRentInterval: e.target.value})} className="w-full p-2 text-[13px] bg-crm-surface border border-crm-border rounded">
                       <option value="WEEKLY">Weekly</option>
                       <option value="MONTHLY">Monthly</option>
                     </select>
                   </div>
                 </div>
               )}
               <div className="flex items-center gap-2 mt-2">
                 <input type="checkbox" id="inv" checked={formData.canManageInventory} onChange={e => setFormData({...formData, canManageInventory: e.target.checked})} className="rounded text-crm-primary focus:ring-crm-primary" />
                 <label htmlFor="inv" className="text-[13px] font-medium text-crm-text">Can Manage Inventory</label>
               </div>
             </div>
          ) : (
            <>
              <h2 className="font-bold text-crm-primary mb-1 text-center text-xl">{staff.name || staff.email || 'Unnamed Staff'}</h2>
              <div className="flex gap-2 mb-6 justify-center">
                <span className="text-[11px] bg-crm-primary/20 text-crm-accent px-3 py-1 rounded-full uppercase tracking-wider font-bold hover:opacity-90">
                  {staff.role?.replace('_', ' ')}
                </span>
                <span className="text-[11px] bg-crm-surface border border-crm-border text-crm-text px-3 py-1 rounded-full uppercase tracking-wider font-bold hover:opacity-90">
                  {staff.employmentType || 'W2'}
                </span>
              </div>
            </>
          )}

          <div className="bg-crm-surface p-3 rounded-xl mb-6 shadow-sm">
            <QRCodeSVG value={staff.barcode || staff.id} size={120} level="H" />
            <p className="text-center text-crm-muted font-mono mt-2 tracking-wider text-[13px]">{staff.barcode || 'NO_CODE'}</p>
          </div>
          
          <div className="w-full space-y-4 text-[13px] bg-crm-surface p-4 rounded-xl border border-crm-border shadow-sm mb-4">
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center border-b border-crm-border pb-3">
              <span className="text-crm-muted font-medium">Email</span>
              <span className="text-crm-text font-medium truncate ml-4">{staff.email}</span>
            </div>
            {!isEditing && (
              <>
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center border-b border-crm-border pb-3">
                  <span className="text-crm-muted font-medium">Phone</span>
                  <span className="text-crm-text font-medium">{staff.phone || 'Not provided'}</span>
                </div>
                {staff.employmentType === 'CONTRACTOR' && staff.boothRentAmount && (
                  <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center border-b border-crm-border pb-3">
                    <span className="text-crm-muted font-medium">Booth Rent</span>
                    <span className="text-crm-text font-medium">${staff.boothRentAmount} / {staff.boothRentInterval?.toLowerCase()}</span>
                  </div>
                )}
                <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center">
                  <span className="text-crm-muted font-medium">Manage Inventory</span>
                  <span className="text-crm-text font-medium">{staff.canManageInventory ? 'Yes' : 'No'}</span>
                </div>
              </>
            )}
          </div>
          
          {shopId && (
            <button 
              onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)} 
              disabled={isSaving}
              className={`w-full py-2 rounded-lg text-[13px] font-bold border transition-colors ${isEditing ? 'bg-status-confirmed text-white border-status-confirmed hover:opacity-90' : 'bg-crm-surface text-crm-text border-crm-border hover:border-crm-primary'}`}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Save Profile' : 'Edit Profile Details'}
            </button>
          )}
        </div>
        
        <div className="pt-4 border-t border-crm-border shrink-0 mt-auto">
          <button onClick={() => setIsOpen(false)} className="w-full py-3 bg-crm-primary text-white rounded-xl hover:bg-status-pending transition-colors font-bold shadow-lg">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0">
        {children}
      </div>

      {isRendered && mounted && createPortal(modalContent, document.body)}
    </>
  );
}