import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getShopLayoutData } from '@/lib/shop-data';
import Link from 'next/link';
import ShopAdminLayout from '@/components/shop-admin/ShopAdminLayout';

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
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-6 shadow-lg">
          <div className="w-20 h-20 rounded-full bg-brand-gold/20 flex items-center justify-center text-4xl border-2 border-brand-gold/50 shadow-inner overflow-hidden shrink-0">
            {dbUser.name ? dbUser.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{dbUser.name || 'Unnamed Staff'}</h2>
            <p className="text-sm text-gray-400 mb-2">{dbUser.email}</p>
            <span className="inline-block px-3 py-1 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-xs font-bold rounded-full uppercase tracking-wider">
              {dbUser.role === 'STAFF' ? 'Staff Member' : dbUser.role}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-white mb-1">{totalAppointments}</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Total Bookings</span>
          </div>
          <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-brand-gold mb-1">{completedAppointments}</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Completed</span>
          </div>
        </div>

        {/* Menu Links */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg overflow-hidden divide-y divide-white/5">
          <Link href={`/shop/${shopId}/waitlist`} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors active:bg-white/10">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-blue-500/20 text-blue-400 w-10 h-10 rounded-full flex items-center justify-center">📋</span>
              <div>
                <h3 className="text-white font-semibold text-base">Walk-in Waitlist</h3>
                <p className="text-xs text-gray-400">Manage walk-ins and wait times</p>
              </div>
            </div>
            <span className="text-gray-500">→</span>
          </Link>
          
          <Link href={`/shop/${shopId}/leave`} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors active:bg-white/10">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-amber-500/20 text-amber-400 w-10 h-10 rounded-full flex items-center justify-center">🏖️</span>
              <div>
                <h3 className="text-white font-semibold text-base">Time Off & Leave</h3>
                <p className="text-xs text-gray-400">Request vacations and manage absences</p>
              </div>
            </div>
            <span className="text-gray-500">→</span>
          </Link>
          
          <Link href={`/shop/${shopId}/reports/commissions`} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors active:bg-white/10">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-green-500/20 text-green-400 w-10 h-10 rounded-full flex items-center justify-center">💰</span>
              <div>
                <h3 className="text-white font-semibold text-base">My Earnings</h3>
                <p className="text-xs text-gray-400">Track your commissions and tips</p>
              </div>
            </div>
            <span className="text-gray-500">→</span>
          </Link>

          <Link href={`/shop/${shopId}/portfolio`} className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors active:bg-white/10">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-purple-500/20 text-purple-400 w-10 h-10 rounded-full flex items-center justify-center">📸</span>
              <div>
                <h3 className="text-white font-semibold text-base">My Portfolio</h3>
                <p className="text-xs text-gray-400">Manage your gallery of haircuts</p>
              </div>
            </div>
            <span className="text-gray-500">→</span>
          </Link>

          <Link href="/my-appointments/profile" className="flex items-center justify-between p-5 hover:bg-white/5 transition-colors active:bg-white/10">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-slate-500/20 text-slate-400 w-10 h-10 rounded-full flex items-center justify-center">⚙️</span>
              <div>
                <h3 className="text-white font-semibold text-base">Account Settings</h3>
                <p className="text-xs text-gray-400">Update password and global details</p>
              </div>
            </div>
            <span className="text-gray-500">→</span>
          </Link>
        </div>
        
        <div className="pt-4 pb-8">
            <Link href="/logout" className="w-full flex items-center justify-center gap-2 py-4 bg-red-900/20 hover:bg-red-900/40 text-red-400 font-bold rounded-xl border border-red-500/20 transition-colors">
                <span>🚪</span> Sign Out
            </Link>
        </div>

      </div>
    </ShopAdminLayout>
  );
}
