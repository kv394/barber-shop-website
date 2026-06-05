import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import Link from 'next/link';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';
import ProfileEditor from '@/components/shop-admin/ProfileEditor';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: Promise<{ shopId: string }> }) {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 
 const userId = user?.id;
 if (!userId) return redirect('/');

 const data = await getShopLayoutData(userId, shopId);
 if (!data) return redirect('/');

 const { shop, shopSlug, userRole } = data;
 const dbUser = data.user;

 // Let's get some basic stats
 const [totalAppointments, completedAppointments] = await Promise.all([
 prisma.appointment.count({ where: { staffId: dbUser.id, shopId } }),
 prisma.appointment.count({ where: { staffId: dbUser.id, shopId, status: 'COMPLETED' } })
 ]);

 return (
 <ShopAdminLayout
 shopName={shop.name}
 shopSlug={shopSlug}
 pageTitle="My Profile"
 shopId={shopId}
 userRole={userRole as string}
 activeTab="profile"
 >
 <div className="max-w-2xl mx-auto space-y-6">
 
 {/* Profile Header */}
 <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border shadow-sm rounded-2xl p-6 flex items-center gap-6 shadow-lg">
 <div className="w-20 h-20 rounded-full bg-crm-primary/20 flex items-center justify-center text-4xl border-2 border-brand-indigo/50 shadow-inner overflow-hidden shrink-0 hover:opacity-90">
  {dbUser.name ? dbUser.name.charAt(0).toUpperCase() : '👤'}
 </div>
 <div>
  <h2 className="font-bold text-crm-text mb-1 text-xl">{dbUser.name || 'Unnamed Staff'}</h2>
  <p className="text-crm-muted mb-2 text-[13px]">{dbUser.email}</p>
  <span className="inline-block px-3 py-1 bg-crm-primary/10 border border-brand-indigo/30 text-crm-accent text-[11px] font-bold rounded-full uppercase tracking-wider hover:opacity-90">
  {dbUser.role === 'STAFF' ? 'Staff Member' : dbUser.role === 'BOOTH_RENTER' ? 'Booth Renter' : dbUser.role}
  </span>
 </div>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border shadow-sm rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center">
  <span className="text-3xl font-black text-crm-text mb-1">{totalAppointments}</span>
  <span className="text-[11px] text-crm-muted uppercase tracking-widest font-semibold">Total Bookings</span>
 </div>
 <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border shadow-sm rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center">
  <span className="text-3xl font-black text-crm-accent mb-1">{completedAppointments}</span>
  <span className="text-[11px] text-crm-muted uppercase tracking-widest font-semibold">Completed</span>
 </div>
 </div>

 {/* Inline Account Details & Security */}
 <ProfileEditor />
 
 {/* Sign Out */}
 <div className="pt-2 pb-8">
 <Link href="/logout" className="w-full flex items-center justify-center gap-2 py-4 bg-status-cancelled/20 hover:bg-status-cancelled/30 text-status-cancelled font-bold rounded-xl border border-status-cancelled/20 transition-colors">
  <span>🚪</span> Sign Out
 </Link>
 </div>

 </div>
 </ShopAdminLayout>
 );
}
