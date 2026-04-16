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
        <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border shadow-sm rounded-2xl p-6 flex items-center gap-6 shadow-lg">
          <div className="w-20 h-20 rounded-full bg-crm-primary/20 flex items-center justify-center text-4xl border-2 border-brand-gold/50 shadow-inner overflow-hidden shrink-0 hover:opacity-90">
            {dbUser.name ? dbUser.name.charAt(0).toUpperCase() : '👤'}
          </div>
          <div>
            <h2 className="font-bold text-crm-text mb-1 text-3xl md:text-4xl">{dbUser.name || 'Unnamed Staff'}</h2>
            <p className="text-crm-muted mb-2 text-base md:text-lg">{dbUser.email}</p>
            <span className="inline-block px-3 py-1 bg-crm-primary/10 border border-brand-gold/30 text-crm-accent text-xs font-bold rounded-full uppercase tracking-wider hover:opacity-90">
              {dbUser.role === 'STAFF' ? 'Staff Member' : dbUser.role}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border shadow-sm rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-crm-text mb-1">{totalAppointments}</span>
            <span className="text-xs text-crm-muted uppercase tracking-widest font-semibold">Total Bookings</span>
          </div>
          <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border shadow-sm rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-crm-accent mb-1">{completedAppointments}</span>
            <span className="text-xs text-crm-muted uppercase tracking-widest font-semibold">Completed</span>
          </div>
        </div>

        {/* Menu Links */}
        <div className="bg-crm-bg/80 backdrop-blur-xl border border-crm-border shadow-sm rounded-2xl shadow-lg overflow-hidden divide-y divide-white/5">
          <Link href={`/shop/${shopId}/waitlist`} className="flex items-center justify-between p-5 hover:bg-crm-surface transition-colors active:bg-crm-border">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-status-info/20 text-status-info w-10 h-10 rounded-full flex items-center justify-center">📋</span>
              <div>
                <h3 className="text-crm-text font-semibold text-2xl md:text-3xl">Walk-in Waitlist</h3>
                <p className="text-crm-muted text-base md:text-lg">Manage walk-ins and wait times</p>
              </div>
            </div>
            <span className="text-crm-muted">→</span>
          </Link>
          
          <Link href={`/shop/${shopId}/leave`} className="flex items-center justify-between p-5 hover:bg-crm-surface transition-colors active:bg-crm-border">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-status-pending/20 text-status-pending w-10 h-10 rounded-full flex items-center justify-center">🏖️</span>
              <div>
                <h3 className="text-crm-text font-semibold text-2xl md:text-3xl">Time Off & Leave</h3>
                <p className="text-crm-muted text-base md:text-lg">Request vacations and manage absences</p>
              </div>
            </div>
            <span className="text-crm-muted">→</span>
          </Link>
          
          <Link href={`/shop/${shopId}/reports/commissions`} className="flex items-center justify-between p-5 hover:bg-crm-surface transition-colors active:bg-crm-border">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-status-confirmed/20 text-status-confirmed w-10 h-10 rounded-full flex items-center justify-center">💰</span>
              <div>
                <h3 className="text-crm-text font-semibold text-2xl md:text-3xl">My Earnings</h3>
                <p className="text-crm-muted text-base md:text-lg">Track your commissions and tips</p>
              </div>
            </div>
            <span className="text-crm-muted">→</span>
          </Link>

          <Link href={`/shop/${shopId}/portfolio`} className="flex items-center justify-between p-5 hover:bg-crm-surface transition-colors active:bg-crm-border">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-crm-accent/20 text-crm-accent w-10 h-10 rounded-full flex items-center justify-center">📸</span>
              <div>
                <h3 className="text-crm-text font-semibold text-2xl md:text-3xl">My Portfolio</h3>
                <p className="text-crm-muted text-base md:text-lg">Manage your gallery of haircuts</p>
              </div>
            </div>
            <span className="text-crm-muted">→</span>
          </Link>

          <Link href="/my-appointments/profile" className="flex items-center justify-between p-5 hover:bg-crm-surface transition-colors active:bg-crm-border">
            <div className="flex items-center gap-4">
              <span className="text-xl bg-crm-border text-crm-muted w-10 h-10 rounded-full flex items-center justify-center">⚙️</span>
              <div>
                <h3 className="text-crm-text font-semibold text-2xl md:text-3xl">Account Settings</h3>
                <p className="text-crm-muted text-base md:text-lg">Update password and global details</p>
              </div>
            </div>
            <span className="text-crm-muted">→</span>
          </Link>
        </div>
        
        <div className="pt-4 pb-8">
            <Link href="/logout" className="w-full flex items-center justify-center gap-2 py-4 bg-status-cancelled/20 hover:bg-status-cancelled/20 text-status-cancelled font-bold rounded-xl border border-status-cancelled/20 transition-colors">
                <span>🚪</span> Sign Out
            </Link>
        </div>

      </div>
    </ShopAdminLayout>
  );
}
