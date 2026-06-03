'use client';

import { useActionState, useEffect, useRef } from 'react';

export default function InviteFormClient({
 inviteAction,
 shopId,
 userRole,
 canAddShopAdmin,
}: {
 inviteAction: (prevState: any, formData: FormData) => Promise<{ success: boolean; error?: string }>;
 shopId: string;
 userRole: string;
 canAddShopAdmin: boolean;
}) {
 const [state, formAction, isPending] = useActionState(inviteAction, { success: false });
 const formRef = useRef<HTMLFormElement>(null);

 // Reset form on success
 useEffect(() => {
 if (state?.success && formRef.current) {
  formRef.current.reset();
 }
 }, [state]);

 return (
 <>
  <form ref={formRef} action={formAction} className="flex flex-col md:flex-row gap-4 items-end">
  <input type="hidden" name="shopId" value={shopId} />
  <div className="flex-1 w-full">
   <label className="block text-crm-muted mb-1.5 font-semibold uppercase tracking-wider text-[12px]">📧 Email</label>
   <input type="email" name="email" required placeholder="team@example.com"
   className="w-full h-11 px-4 rounded-xl border border-crm-border shadow-sm bg-crm-surface text-crm-text text-[13px] placeholder-gray-400 focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all" />
  </div>
  <div className="w-full md:w-56">
   <label className="block text-crm-muted mb-1.5 font-semibold uppercase tracking-wider text-[12px]">👤 Role</label>
   <select name="role" defaultValue={userRole === 'SITE_ADMIN' ? 'SHOP_ADMIN' : 'STAFF'}
   className="w-full h-11 px-4 rounded-xl border border-crm-border shadow-sm bg-crm-surface text-crm-text text-[13px] focus:ring-2 focus:ring-crm-primary focus:outline-none transition-all">
   {userRole === 'SHOP_ADMIN' && <option value="STAFF">Staff</option>}
   {userRole === 'SHOP_ADMIN' && <option value="BOOTH_RENTER">Booth Renter</option>}
   {userRole === 'SITE_ADMIN' && (
    <>
    <option value="SHOP_ADMIN">Shop Admin</option>
    <option value="ATTENDANCE_KIOSK">Attendance Kiosk</option>
    </>
   )}
   </select>
  </div>
  <div className="w-full md:w-auto mt-2 md:mt-0">
   <button type="submit" disabled={(userRole === 'SITE_ADMIN' && !canAddShopAdmin) || isPending}
   className="w-full h-11 bg-crm-primary text-white font-bold px-8 rounded-xl hover:bg-crm-primary/90 hover:scale-[1.02] active:scale-95 transition-all duration-200 shadow-md text-[13px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
   {isPending ? (
    <>
    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
    Inviting...
    </>
   ) : 'Invite Member'}
   </button>
  </div>
  </form>

  {/* Success message */}
  {state?.success && (
  <div className="mt-3 flex items-center gap-2 text-[13px] text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200 animate-in fade-in duration-300">
   <span className="text-lg">✅</span>
   <span className="font-medium">Team member invited successfully! An invite email has been sent.</span>
  </div>
  )}

  {/* Error / Warning message */}
  {state?.error && (
  <div className="mt-3 flex items-start gap-2 text-[13px] text-red-700 bg-red-50 px-4 py-3 rounded-xl border border-red-200 animate-in fade-in duration-300">
   <span className="text-lg shrink-0 mt-0.5">⚠️</span>
   <span className="font-medium">{state.error}</span>
  </div>
  )}
 </>
 );
}
