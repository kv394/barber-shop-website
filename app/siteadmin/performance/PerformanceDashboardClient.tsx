'use client';

import { useState, useEffect } from 'react';
import PremiumGlassCard from '@/components/ui/PremiumGlassCard';

type ShopPerformance = {
 id: string;
 name: string;
 tier: string;
 users: number;
 appointments: number;
 storageMB: number;
 suggestedFee: number;
 period: string;
};

type KPIs = {
 totalShops: number;
 totalUsers: number;
 totalAppointments: number;
 totalStorageMB: number;
 totalSuggestedRevenue: number;
};

export default function PerformanceDashboardClient() {
 const [kpis, setKpis] = useState<KPIs | null>(null);
 const [topShops, setTopShops] = useState<ShopPerformance[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 fetch('/api/siteadmin/performance')
 .then(res => res.json())
 .then(data => {
 setKpis(data.kpis);
 setTopShops(data.topShops || []);
 setLoading(false);
 });
 }, []);

 if (loading) {
 return <div className="py-20 text-center font-bold text-crm-muted">Loading performance data...</div>;
 }

 return (
 <div className="space-y-8">
 
 {/* KPIs */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
 <PremiumGlassCard accentColor="crm-primary" className="!p-6 text-center">
 <p className="text-[10px] uppercase tracking-widest font-black text-crm-muted mb-2">Total Shops</p>
 <p className="text-4xl font-black text-crm-text">{kpis?.totalShops.toLocaleString()}</p>
 </PremiumGlassCard>
 
 <PremiumGlassCard accentColor="cyan-500" className="!p-6 text-center">
 <p className="text-[10px] uppercase tracking-widest font-black text-crm-muted mb-2">Platform Users</p>
 <p className="text-4xl font-black text-crm-text">{kpis?.totalUsers.toLocaleString()}</p>
 </PremiumGlassCard>
 
 <PremiumGlassCard accentColor="emerald-500" className="!p-6 text-center">
 <p className="text-[10px] uppercase tracking-widest font-black text-crm-muted mb-2">Total Appointments</p>
 <p className="text-4xl font-black text-crm-text">{kpis?.totalAppointments.toLocaleString()}</p>
 </PremiumGlassCard>
 
 <PremiumGlassCard accentColor="brand-indigo" className="!p-6 text-center">
 <p className="text-[10px] uppercase tracking-widest font-black text-crm-muted mb-2">MRR Potential</p>
 <p className="text-4xl font-black text-crm-text">${kpis?.totalSuggestedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
 <p className="text-[10px] text-crm-muted font-bold mt-1 uppercase tracking-widest">Suggested</p>
 </PremiumGlassCard>
 </div>

 <PremiumGlassCard accentColor="crm-primary" className="!p-6 flex justify-between items-center bg-white/40">
 <div>
 <p className="text-[11px] uppercase tracking-widest font-black text-crm-muted">Total Storage Utilized</p>
 <p className="text-2xl font-black text-crm-text mt-1">{kpis?.totalStorageMB.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm text-crm-muted">MB</span></p>
 </div>
 <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 flex items-center justify-center bg-purple-500/10 shadow-inner">
 <span className="text-xl">💾</span>
 </div>
 </PremiumGlassCard>

 {/* Top Shops Table */}
 <PremiumGlassCard accentColor="crm-primary" className="!p-0 overflow-hidden">
 <div className="px-6 py-5 border-b border-white/20 bg-white/40 flex justify-between items-center">
 <h2 className="text-lg font-black text-crm-text">Most Active Shops</h2>
 <span className="text-[10px] uppercase tracking-widest font-bold text-crm-muted bg-white/50 px-3 py-1.5 rounded-full shadow-inner border border-white/20">By Appointment Volume</span>
 </div>
 
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-white/20 border-b border-white/20">
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted">Shop Name</th>
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted">Plan / Tier</th>
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted text-right">Appts (Mo)</th>
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted text-right">Users</th>
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted text-right">Storage</th>
 <th className="p-4 text-[10px] uppercase tracking-widest font-black text-crm-muted text-right">MRR</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-white/10 text-[13px]">
 {topShops.length === 0 ? (
 <tr>
 <td colSpan={6} className="p-8 text-center text-crm-muted font-bold">No shop usage data generated yet.</td>
 </tr>
 ) : (
 topShops.map((shop, i) => (
 <tr key={shop.id} className="hover:bg-white/40 transition-colors">
 <td className="p-4 font-bold text-crm-text flex items-center gap-3">
 <span className="text-[10px] text-crm-muted font-mono bg-white/50 w-6 h-6 flex items-center justify-center rounded-full shadow-inner border border-white/20">
 {i + 1}
 </span>
 {shop.name}
 </td>
 <td className="p-4">
 <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-crm-bg/50 border border-white/20 shadow-inner text-crm-primary">
 {shop.tier}
 </span>
 </td>
 <td className="p-4 text-right font-black text-crm-text">{shop.appointments.toLocaleString()}</td>
 <td className="p-4 text-right font-bold text-crm-muted">{shop.users}</td>
 <td className="p-4 text-right font-mono text-[12px] text-crm-muted">{shop.storageMB.toFixed(1)} MB</td>
 <td className="p-4 text-right font-black text-emerald-600">${shop.suggestedFee.toFixed(2)}</td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </PremiumGlassCard>
 </div>
 );
}
