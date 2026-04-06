import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

async function getShopData(shopId: string, userId: string) {
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return null;

  // STAFF sees only their own leave; admins see all staff
  const staffWhere = data.isStaff
    ? { id: userId }
    : { shopId: shopId, role: 'STAFF' as const };

  const staff = await prisma.user.findMany({
    where: staffWhere,
    include: {
      leaves: {
        where: { date: { gte: new Date() } },
        orderBy: { date: 'asc' },
      },
    },
  });

  return { 
    shop: data.shop,
    shopSlug: data.shopSlug,
    userRole: data.userRole,
    isStaff: data.isStaff,
    currentUserId: userId,
    staff: JSON.parse(JSON.stringify(staff))
  };
}

async function addLeave(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return;

  const staffId = formData.get('staffId') as string;
  const date = formData.get('date') as string;
  const reason = formData.get('reason') as string;
  const shopId = formData.get('shopId') as string;

  if (!staffId || !date || !shopId) return;

  // Security: verify the requesting user has permission (must be the staff member themselves or an admin)
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return;
  if (data.isStaff && data.user.id !== staffId) return; // STAFF can only add their own leave

  // SECURITY: Verify the target staff member belongs to this shop
  const targetStaff = await prisma.user.findUnique({ where: { id: staffId } });
  if (!targetStaff || targetStaff.shopId !== shopId) return;

  const leaveDate = new Date(date);
  const startTime = new Date(date);
  startTime.setUTCHours(0, 0, 0, 0);
  const endTime = new Date(date);
  endTime.setUTCHours(23, 59, 0, 0);

  await prisma.leave.create({
    data: {
      userId: staffId,
      shopId: shopId,
      date: leaveDate,
      startTime,
      endTime,
      reason: reason,
    },
  });
  revalidatePath(`/shop/${shopId}/leave`);
}

async function deleteLeave(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) return;

  const leaveId = formData.get('leaveId') as string;
  const shopId = formData.get('shopId') as string;
  const staffId = formData.get('staffId') as string;

  if (!leaveId || !shopId) return;

  // Security: verify the requesting user has permission
  const data = await getShopLayoutData(userId, shopId);
  if (!data) return;
  if (data.isStaff && data.user.id !== staffId) return; // STAFF can only delete their own leave

  // SECURITY: Verify the leave belongs to this shop before deleting (prevent cross-shop deletion)
  const leave = await prisma.leave.findUnique({ where: { id: leaveId } });
  if (!leave || leave.shopId !== shopId) return;

  await prisma.leave.delete({ where: { id: leaveId } });
  revalidatePath(`/shop/${shopId}/leave`);
}

export default async function LeaveManagementPage({ params }: { params: Promise<{ shopId: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const userId = user?.id;
  if (!userId) redirect('/sign-in');

  const { shopId } = await params;
  const shopData = await getShopData(shopId, userId);

  if (!shopData) {
    return <div className="p-8 text-white">You do not have access to this page.</div>;
  }

  const { shop, shopSlug, userRole, isStaff, staff } = shopData;

  return (
    <ShopAdminLayout
      shopName={shop.name}
      shopSlug={shopSlug}
      pageTitle={isStaff ? 'My Leave Schedule' : 'Staff Leave Management'}
      shopId={shopId}
      userRole={userRole}
      activeTab="leave"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((staffMember: any) => (
          <div key={staffMember.id} className="bg-slate-900/70 border border-white/10 rounded-lg p-4 space-y-4">
            <h2 className="text-xl font-semibold text-brand-gold">{staffMember.name}</h2>
            
            <form action={addLeave} className="space-y-2">
              <input type="hidden" name="staffId" value={staffMember.id} />
              <input type="hidden" name="shopId" value={shop.id} />
              <input type="date" name="date" required style={{ colorScheme: 'dark', color: '#fff', backgroundColor: '#1e293b' }} className="w-full p-2.5 rounded-lg border border-slate-600 text-white" min={new Date().toISOString().split('T')[0]} />
              <input type="text" name="reason" placeholder="Reason (optional)" className="w-full bg-slate-800 p-2 rounded border border-slate-700" />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded text-sm font-bold">
                {isStaff ? 'Request Leave' : 'Add Leave'}
              </button>
            </form>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-gray-400 border-b border-slate-700 pb-1">Upcoming Leave</h3>
              {staffMember.leaves.length > 0 ? (
                staffMember.leaves.map((leave: any) => (
                  <div key={leave.id} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                    <div>
                      <p className="font-semibold">{new Date(leave.date).toLocaleDateString()}</p>
                      {leave.reason && <p className="text-xs text-gray-400">{leave.reason}</p>}
                    </div>
                    <form action={deleteLeave}>
                      <input type="hidden" name="leaveId" value={leave.id} />
                      <input type="hidden" name="shopId" value={shop.id} />
                      <input type="hidden" name="staffId" value={staffMember.id} />
                      <button type="submit" className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                    </form>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No upcoming leave scheduled.</p>
              )}
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <p className="text-gray-500 italic col-span-3 text-center py-8 border border-dashed border-white/20 rounded text-sm">
            No staff members found.
          </p>
        )}
      </div>
    </ShopAdminLayout>
  );
}
