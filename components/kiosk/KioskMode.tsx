'use client';

import { useState, useEffect } from 'react';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import BarcodeScannerWrapper from '@/components/checkout/BarcodeScannerWrapper';

type UserProfile = {
  id: string;
  role: 'SITE_ADMIN' | 'SHOP_ADMIN' | 'STAFF' | 'CLIENT' | 'ATTENDANCE_KIOSK';
  name: string | null;
  email: string;
  shopId?: string;
  shop?: { name: string, id: string, slug?: string };
} | null;

type ActiveLog = {
    id: string;
    clockIn: string;
    user: {
        name: string | null;
        email: string;
    }
}

type WaitlistEntry = {
    id: string;
    clientName: string;
    status: string;
    position: number;
    createdAt: string;
}

export default function KioskMode({ userProfile }: { userProfile: UserProfile }) {
    const [activeLogs, setActiveLogs] = useState<ActiveLog[]>([]);
    const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);

    const fetchKioskData = async () => {
        if (!userProfile?.shopId) return;
        try {
            const [attendanceRes, waitlistRes] = await Promise.all([
                fetch(`/api/shops/${userProfile.shopId}/attendance`),
                fetch(`/api/shops/${userProfile.shopId}/waitlist`)
            ]);
            
            if (attendanceRes.ok) {
                const attendanceData = await attendanceRes.json();
                setActiveLogs(attendanceData);
            }
            if (waitlistRes.ok) {
                const waitlistData = await waitlistRes.json();
                setWaitlist(waitlistData);
            }
        } catch (error) {
            console.error("Failed to fetch kiosk data", error);
        } finally {
            setIsLoadingLogs(false);
        }
    };

    useEffect(() => {
        fetchKioskData();
        // Refresh the list every 30 seconds
        const interval = setInterval(fetchKioskData, 30000);
        return () => clearInterval(interval);
    }, [userProfile?.shopId]);

    return (
        <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-botanical-bg">
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
                <SupabaseAuthButton />
            </div>
            
            {/* Header */}
            <div className="text-center w-full max-w-7xl mx-auto flex-shrink-0 mb-6 md:mb-10 mt-4">
                <h1 className="font-serif font-bold text-botanical-accent mb-2 text-4xl md:text-5xl lg:text-6xl">
                    {userProfile?.shop?.name || "Shop Hub"}
                </h1>
                <h2 className="text-botanical-muted text-3xl md:text-4xl">Time & Attendance Kiosk</h2>
            </div>
            
            {/* Main Content */}
            <div className="flex-grow w-full max-w-7xl mx-auto flex flex-col justify-center pb-8 px-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-full min-h-[600px]">
                    
                    {/* Scanner Section (Left Side on Large Screens) */}
                    <div className="lg:col-span-5 bg-botanical-surface p-6 md:p-8 lg:p-12 rounded-3xl border border-botanical-border shadow-sm shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
                        {/* Decorative background glow */}
                        <div className="absolute inset-0 bg-botanical-primary/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-botanical-primary/10 transition-colors duration-700"></div>

                        <div className="bg-botanical-primary/10 text-botanical-accent p-4 rounded-full mb-6 z-10 border border-brand-gold/20">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
                            </svg>
                        </div>
                        <h3 className="font-bold text-botanical-text mb-3 text-center z-10 text-2xl md:text-3xl">Scan ID</h3>
                        <p className="text-botanical-muted mb-8 md:mb-12 text-center z-10 max-w-xs text-base md:text-lg">Staff members, please scan your personal QR code to clock in or out.</p>
                        
                        {userProfile?.shopId ? (
                            <div className="transform scale-125 md:scale-150 lg:scale-[1.7] origin-center inline-block bg-white p-3 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10 border-4 border-slate-200">
                                <BarcodeScannerWrapper shopId={userProfile.shopId} services={[]} />
                            </div>
                        ) : (
                            <p className="text-red-400 bg-red-900/20 p-4 rounded-lg border border-red-500/30 z-10 text-base md:text-lg">Error: Kiosk not assigned to a shop.</p>
                        )}
                    </div>

                    {/* Lists Section (Right Side on Large Screens) */}
                    <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
                        
                        {/* Clocked In Staff */}
                        <div className="flex-1 bg-botanical-surface p-6 md:p-8 rounded-3xl border border-botanical-border shadow-sm shadow-2xl flex flex-col max-h-[50vh] lg:max-h-[350px]">
                            <div className="flex items-center gap-4 mb-6 shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl border border-blue-500/30">👥</div>
                                <h3 className="font-serif text-botanical-text text-2xl md:text-3xl">Currently Clocked In</h3>
                                <span className="ml-auto bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-500/30">
                                    {activeLogs.length} Staff
                                </span>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                {isLoadingLogs ? (
                                    <div className="flex justify-center items-center h-full min-h-[100px]">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                                    </div>
                                ) : activeLogs.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {activeLogs.map(log => (
                                            <div key={log.id} className="bg-botanical-surface p-4 rounded-xl flex flex-wrap justify-between gap-x-2 gap-y-2 items-center gap-3 border border-botanical-border shadow-sm hover:border-botanical-border transition-colors">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-botanical-text truncate text-base md:text-lg">{log.user.name || log.user.email.split('@')[0]}</p>
                                                    <p className="text-botanical-muted truncate text-base md:text-lg">{log.user.email}</p>
                                                </div>
                                                <div className="text-right shrink-0 bg-botanical-surface px-3 py-1.5 rounded-lg border border-botanical-border shadow-sm">
                                                    <p className="text-botanical-muted uppercase tracking-wider mb-0.5 text-base md:text-lg">In since</p>
                                                    <span className="text-botanical-accent font-mono text-base font-bold">
                                                        {new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-botanical-muted py-8 min-h-[150px]">
                                        <span className="text-4xl mb-3 opacity-50">📭</span>
                                        <p className="italic text-base md:text-lg">No staff currently clocked in.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Checked-In Clients */}
                        <div className="flex-1 bg-botanical-surface p-6 md:p-8 rounded-3xl border border-botanical-border shadow-sm shadow-2xl flex flex-col max-h-[50vh] lg:max-h-[350px]">
                            <div className="flex items-center gap-4 mb-6 shrink-0">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl border border-purple-500/30">🛋️</div>
                                <h3 className="font-serif text-botanical-text text-2xl md:text-3xl">Checked-In Clients</h3>
                                <span className="ml-auto bg-purple-500/20 text-purple-300 px-4 py-1.5 rounded-full text-sm font-bold border border-purple-500/30">
                                    {waitlist.length} Waiting
                                </span>
                            </div>
                            
                            <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                                {isLoadingLogs ? (
                                    <div className="flex justify-center items-center h-full min-h-[100px]">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                                    </div>
                                ) : waitlist.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {waitlist.map(entry => (
                                            <div key={entry.id} className={`p-4 rounded-xl flex justify-between items-center gap-3 border ${entry.status === 'SERVING' ? 'bg-green-900/20 border-green-500/30' : 'bg-botanical-surface border-botanical-border'}`}>
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-lg shrink-0 border ${entry.status === 'SERVING' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-botanical-surface text-botanical-muted border-botanical-border'}`}>
                                                        {entry.position}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-botanical-text truncate text-base md:text-lg">{entry.clientName}</p>
                                                        <p className="text-botanical-muted text-base md:text-lg">Arrived {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </div>
                                                </div>
                                                <span className={`shrink-0 text-sm font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${entry.status === 'SERVING' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                                    {entry.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-botanical-muted py-8 min-h-[150px]">
                                        <span className="text-4xl mb-3 opacity-50">✨</span>
                                        <p className="italic text-base md:text-lg">No clients currently waiting.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </main>
    )
}
