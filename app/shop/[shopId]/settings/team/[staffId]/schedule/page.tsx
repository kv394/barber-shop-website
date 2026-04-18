'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import { updateSchedule, addLeave, deleteLeave } from './actions';

const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function SchedulePage() {
  const params = useParams();
  const router = useRouter();
  const { shopId, staffId } = params;

  const [shop, setShop] = useState<any>(null);
  const [staffMember, setStaffMember] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // We only need state to track which days are enabled/disabled
  const [enabledDays, setEnabledDays] = useState<Record<string, boolean>>({});
  
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/shops/${shopId}/staff/${staffId}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setShop(data.shop);
      setStaffMember(data.staffMember);
      setUserRole(data.userRole);
      
      const initialHours = data.staffMember.workingHours || {};
      const initialEnabled: Record<string, boolean> = {};
      daysOfWeek.forEach(day => {
          initialEnabled[day] = initialHours[day] !== null && initialHours[day] !== undefined;
      });
      setEnabledDays(initialEnabled);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shopId && staffId) {
      fetchData();
    }
  }, [shopId, staffId]);

  const handleCheckboxChange = (day: string, checked: boolean) => {
    setEnabledDays(prev => ({ ...prev, [day]: checked }));
  };

  const handleScheduleSubmit = async (formData: FormData) => {
      setIsSaving(true);
      try {
          await updateSchedule(formData);
          // Instead of fetching data again, we can just refresh the router
          // to trigger a server-side re-render of the parent layout if needed,
          // though the updateSchedule action already revalidates the path.
      } finally {
          setIsSaving(false);
      }
  };

  if (isLoading) {
    return <div className="p-8 text-crm-text text-center">Loading...</div>;
  }

  if (!staffMember || !shop) {
    return <div className="p-8 text-crm-text text-center">Access denied or user not found.</div>;
  }

  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const initialHours = staffMember.workingHours || {};

  const teamTabs = [
    { id: 'team', label: 'Team & Availability', href: `/shop/${shop.id}/settings/team` },
    { id: 'portfolio', label: 'Portfolio', href: `/shop/${shop.id}/portfolio` }
  ];

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle={`Edit Profile & Schedule for ${staffMember.name || staffMember.email.split('@')[0]}`}
      shopId={shop.id}
      userRole={userRole || ''}
      activeTab="team"
      tabs={userRole === 'SITE_ADMIN' ? undefined : teamTabs}
    >
      <div className="bg-crm-bg/50 p-6 rounded-lg border border-crm-border shadow-sm mb-8">
        <h3 className="font-bold mb-6 text-crm-text text-lg font-bold">Staff Details</h3>
        <form 
          onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              name: formData.get('name'),
              phone: formData.get('phone'),
              canManageInventory: formData.get('canManageInventory') === 'true',
            };
            const btn = e.currentTarget.querySelector('button[type="submit"]') as HTMLButtonElement;
            const originalText = btn.innerText;
            btn.innerText = 'Saving...';
            btn.disabled = true;
            try {
              await fetch(`/api/shops/${shop.id}/staff/${staffMember.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              await fetchData();
            } finally {
              btn.innerText = originalText;
              btn.disabled = false;
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div>
            <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[13px]">Name</label>
            <input type="text" name="name" defaultValue={staffMember.name || ''} className="w-full bg-crm-surface p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text focus:ring-2 focus:ring-crm-primary outline-none transition-all" />
          </div>
          <div>
            <label className="block text-crm-muted mb-1 font-semibold uppercase tracking-wider text-[13px]">Phone</label>
            <input type="tel" name="phone" defaultValue={staffMember.phone || ''} className="w-full bg-crm-surface p-2.5 rounded-lg border border-crm-border shadow-sm text-crm-text focus:ring-2 focus:ring-crm-primary outline-none transition-all" />
          </div>
          <div className="flex items-end">
            <div className="flex items-center h-[46px] w-full bg-crm-surface px-4 rounded-lg border border-crm-border shadow-sm">
              <input type="checkbox" id="inventory" name="canManageInventory" value="true" defaultChecked={staffMember.canManageInventory} className="w-4 h-4 accent-brand-gold mr-3" />
              <label htmlFor="inventory" className="font-semibold text-crm-text cursor-pointer select-none text-[13px]">Can Manage Inventory?</label>
            </div>
          </div>
          <div className="md:col-span-3">
            <button type="submit" className="bg-crm-primary text-white font-bold py-2.5 px-8 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors shadow-lg">
              Save Details
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-crm-bg/50 p-6 rounded-lg border border-crm-border shadow-sm">
          <h3 className="font-bold mb-6 text-crm-text text-lg font-bold">Weekly Schedule</h3>
          {/* Use standard form action with uncontrolled inputs */}
          <form action={handleScheduleSubmit}>
            <input type="hidden" name="staffId" value={staffMember.id} />
            <input type="hidden" name="shopId" value={shop.id} />
            <div className="space-y-4">
              {daysOfWeek.map(day => {
                const isEnabled = enabledDays[day];
                const dayHours = initialHours[day] || { open: '09:00', close: '17:00' };
                
                return (
                  <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id={`${day}-enabled`} 
                        name={`${day}-enabled`} 
                        checked={isEnabled} 
                        onChange={e => handleCheckboxChange(day, e.target.checked)} 
                        className="w-5 h-5 accent-brand-gold" 
                      />
                      <label htmlFor={`${day}-enabled`} className="ml-3 font-semibold capitalize text-crm-text text-[13px]">{day}</label>
                    </div>
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      {/* Uncontrolled inputs using defaultValue */}
                      <input 
                        type="time" 
                        name={`${day}-open`} 
                        defaultValue={dayHours.open} 
                        className="bg-crm-surface p-2 rounded border border-crm-border shadow-sm text-crm-text focus:ring-2 focus:ring-crm-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={!isEnabled} 
                      />
                      <input 
                        type="time" 
                        name={`${day}-close`} 
                        defaultValue={dayHours.close} 
                        className="bg-crm-surface p-2 rounded border border-crm-border shadow-sm text-crm-text focus:ring-2 focus:ring-crm-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={!isEnabled} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8">
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-crm-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Weekly Schedule'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-crm-bg/50 p-6 rounded-lg border border-crm-border shadow-sm">
          <h3 className="font-bold mb-6 text-crm-text text-lg font-bold">Manage Leave</h3>
          <form 
            action={async (formData) => {
              await addLeave(formData);
              fetchData(); // refresh list
            }} 
            className="space-y-3 mb-6 p-4 bg-crm-surface rounded-lg"
          >
            <input type="hidden" name="staffId" value={staffMember.id} />
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="date" name="date" required className="w-full bg-crm-surface p-2 rounded border border-crm-border shadow-sm text-crm-text" min={new Date().toISOString().split('T')[0]} />
            <div className="flex gap-2">
              <input type="time" name="startTime" defaultValue="09:00" required className="w-full bg-crm-surface p-2 rounded border border-crm-border shadow-sm text-crm-text" />
              <input type="time" name="endTime" defaultValue="17:00" required className="w-full bg-crm-surface p-2 rounded border border-crm-border shadow-sm text-crm-text" />
            </div>
            <input type="text" name="reason" placeholder="Reason (optional)" className="w-full bg-crm-surface p-2 rounded border border-crm-border shadow-sm text-crm-text" />
            <button type="submit" className="w-full bg-crm-primary hover:bg-crm-surface text-white hover:text-crm-primary border border-transparent hover:border-crm-primary/30 p-2 rounded text-[13px] font-bold transition-colors">Add Leave Day</button>
          </form>
          <div className="space-y-2">
            <h4 className="font-semibold text-crm-muted border-b border-crm-border pb-2 text-base font-semibold">Upcoming Leave</h4>
            {staffMember.leaves.map((leave: any) => (
              <div key={leave.id} className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center bg-crm-surface p-3 rounded border border-crm-border shadow-sm">
                <div>
                  <p className="font-semibold text-crm-text text-[13px]">{new Date(leave.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-crm-muted text-[13px]">{new Date(leave.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(leave.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <form 
                  action={async (formData) => {
                    await deleteLeave(formData);
                    fetchData();
                  }}
                >
                  <input type="hidden" name="leaveId" value={leave.id} />
                  <input type="hidden" name="staffId" value={staffMember.id} />
                  <input type="hidden" name="shopId" value={shop.id} />
                  <button type="submit" className="text-status-cancelled hover:text-status-cancelled text-[11px] font-semibold">DELETE</button>
                </form>
              </div>
            ))}
            {staffMember.leaves.length === 0 && <p className="text-crm-muted italic text-[13px]">No upcoming leave scheduled.</p>}
          </div>
        </div>
      </div>
    </ShopAdminLayout>
  );
}
