'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShopAdminLayout from '@/app/components/ShopAdminLayout';
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
    return <div className="p-8 text-white text-center">Loading...</div>;
  }

  if (!staffMember || !shop) {
    return <div className="p-8 text-white text-center">Access denied or user not found.</div>;
  }

  const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  const initialHours = staffMember.workingHours || {};

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle={`Edit Schedule for ${staffMember.name}`}
      shopId={shop.id}
      userRole={userRole || ''}
      activeTab="team"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/50 p-6 rounded-lg border border-white/10">
          <h3 className="text-2xl font-bold mb-6 text-white">Weekly Schedule</h3>
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
                      <label htmlFor={`${day}-enabled`} className="ml-3 text-lg font-semibold capitalize text-white">{day}</label>
                    </div>
                    <div className="col-span-2 grid grid-cols-2 gap-4">
                      {/* Uncontrolled inputs using defaultValue */}
                      <input 
                        type="time" 
                        name={`${day}-open`} 
                        defaultValue={dayHours.open} 
                        className="bg-slate-800 p-2 rounded border border-slate-700 text-white focus:ring-2 focus:ring-brand-gold outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
                        disabled={!isEnabled} 
                      />
                      <input 
                        type="time" 
                        name={`${day}-close`} 
                        defaultValue={dayHours.close} 
                        className="bg-slate-800 p-2 rounded border border-slate-700 text-white focus:ring-2 focus:ring-brand-gold outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
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
                className="bg-brand-gold text-brand-dark font-bold py-3 px-8 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Weekly Schedule'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-slate-900/50 p-6 rounded-lg border border-white/10">
          <h3 className="text-2xl font-bold mb-6 text-white">Manage Leave</h3>
          <form 
            action={async (formData) => {
              await addLeave(formData);
              fetchData(); // refresh list
            }} 
            className="space-y-3 mb-6 p-4 bg-slate-800/50 rounded-lg"
          >
            <input type="hidden" name="staffId" value={staffMember.id} />
            <input type="hidden" name="shopId" value={shop.id} />
            <input type="date" name="date" required className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-white" min={new Date().toISOString().split('T')[0]} />
            <div className="flex gap-2">
              <input type="time" name="startTime" defaultValue="09:00" required className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-white" />
              <input type="time" name="endTime" defaultValue="17:00" required className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-white" />
            </div>
            <input type="text" name="reason" placeholder="Reason (optional)" className="w-full bg-slate-800 p-2 rounded border border-slate-700 text-white" />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded text-sm font-bold text-white">Add Leave Day</button>
          </form>
          <div className="space-y-2">
            <h4 className="text-lg font-semibold text-gray-300 border-b border-slate-700 pb-2">Upcoming Leave</h4>
            {staffMember.leaves.map((leave: any) => (
              <div key={leave.id} className="flex justify-between items-center bg-slate-800 p-3 rounded border border-slate-700">
                <div>
                  <p className="font-semibold text-white">{new Date(leave.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p className="text-sm text-gray-400">{new Date(leave.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(leave.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
                  <button type="submit" className="text-red-500 hover:text-red-400 text-xs font-semibold">DELETE</button>
                </form>
              </div>
            ))}
            {staffMember.leaves.length === 0 && <p className="text-sm text-gray-500 italic">No upcoming leave scheduled.</p>}
          </div>
        </div>
      </div>
    </ShopAdminLayout>
  );
}
