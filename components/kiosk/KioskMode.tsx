'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import BarcodeScannerWrapper from '@/components/checkout/BarcodeScannerWrapper';
import BarcodeScanner from '@/components/checkout/BarcodeScanner';
import { createClient } from '@/utils/supabase/client';

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
 const [discountScanRequest, setDiscountScanRequest] = useState<{ appointmentId: string, clientName?: string } | null>(null);
 const [isScannerOpen, setIsScannerOpen] = useState(false);
 const [scanResult, setScanResult] = useState<{ success: boolean, message: string } | null>(null);

 // Stabilize the supabase client so we don't recreate it on every render
 const [supabase] = useState(() => createClient());

 useEffect(() => {
 if (!userProfile?.shopId) return;

 const channel = supabase.channel(`kiosk-commands-${userProfile.shopId}`);
 
 channel.on('broadcast', { event: 'REQUEST_DISCOUNT_SCAN' }, (payload) => {
 setDiscountScanRequest(payload.payload as { appointmentId: string, clientName?: string });
 setIsScannerOpen(false);
 setScanResult(null);
 });

 channel.on('broadcast', { event: 'CANCEL_DISCOUNT_SCAN' }, () => {
 setDiscountScanRequest(null);
 setIsScannerOpen(false);
 setScanResult(null);
 });

 channel.on('broadcast', { event: 'DISCOUNT_SCAN_RESULT' }, (payload) => {
 setScanResult({ success: payload.payload.success, message: payload.payload.message });
 });

 channel.subscribe();

 return () => {
 supabase.removeChannel(channel);
 };
 }, [userProfile?.shopId, supabase]);

 const handleDiscountScanned = async (code: string) => {
 if (!discountScanRequest || !userProfile?.shopId) return;
 
 const channel = supabase.channel(`kiosk-commands-${userProfile.shopId}`);
 await channel.send({
 type: 'broadcast',
 event: 'DISCOUNT_CODE_SCANNED',
 payload: { appointmentId: discountScanRequest.appointmentId, code }
 });
 
 setIsScannerOpen(false);
 };

 const handleCloseScanner = async () => {
 if (!discountScanRequest || !userProfile?.shopId) return;
 
 const channel = supabase.channel(`kiosk-commands-${userProfile.shopId}`);
 await channel.send({
 type: 'broadcast',
 event: 'DISCOUNT_SCAN_CANCELLED',
 payload: { appointmentId: discountScanRequest.appointmentId }
 });
 
 setDiscountScanRequest(null);
 setIsScannerOpen(false);
 };

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
    
    if (!userProfile?.shopId) return;
    
    // Instead of polling, use Supabase Realtime to listen for waitlist changes
    const channel = supabase.channel(`waitlist-kiosk-${userProfile.shopId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'Waitlist', filter: `shopId=eq.${userProfile.shopId}` },
        () => { fetchKioskData(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.shopId, supabase]);

 return (
 <main className="h-[100dvh] overflow-y-auto overflow-x-hidden bg-crm-bg">
 <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50 opacity-0 hover:opacity-100 transition-opacity duration-500">
 <SupabaseAuthButton />
 </div>
 
 {/* Header */}
 <div className="text-center w-full max-w-7xl mx-auto flex-shrink-0 mb-6 md:mb-10 mt-4">
 <h1 className="font-serif font-bold text-crm-accent mb-2 text-2xl font-bold">
 {userProfile?.shop?.name || "Shop Hub"}
 </h1>
 <h2 className="text-crm-muted text-xl font-bold">Time & Attendance Kiosk</h2>
 </div>
 
 {/* Main Content */}
 <div className="flex-grow w-full max-w-7xl mx-auto flex flex-col justify-center pb-8 px-4">
 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 h-full min-h-[600px]">
 
 {/* Scanner Section (Left Side on Large Screens) */}
 <div className="lg:col-span-5 bg-crm-surface p-6 md:p-8 lg:p-12 rounded-3xl border border-crm-border shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group">
 {/* Decorative background glow */}
 <div className="absolute inset-0 bg-crm-primary/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-crm-primary/10 transition-colors duration-700 text-white"></div>

 <div className="bg-crm-primary/10 text-crm-accent p-4 rounded-full mb-6 z-10 border border-brand-indigo/20 hover:opacity-90">
 <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
 </svg>
 </div>
 {discountScanRequest ? (
 <div className="flex flex-col items-center z-10 animate-fade-in w-full max-w-[320px]">
 <h3 className="font-serif font-bold text-crm-text mb-1 text-center text-2xl text-status-pending">
 Hello, {discountScanRequest.clientName ? discountScanRequest.clientName.split(' ')[0] : 'Guest'}! 👋
 </h3>
 <p className="text-crm-text font-semibold mb-2 text-center text-base">
 Apply Your Discount
 </p>
 {scanResult ? (
 <div className={`mt-4 mb-8 p-4 w-full rounded-xl border text-center ${scanResult.success ? 'bg-status-confirmed/20 border-status-confirmed text-green-300' : 'bg-status-cancelled/20 border-status-cancelled text-red-300'}`}>
 <p className="font-bold text-lg mb-1">{scanResult.success ? 'Success! 🎉' : 'Oops!'}</p>
 <p className="text-[14px]">{scanResult.message}</p>
 {!scanResult.success ? (
 <button onClick={() => setScanResult(null)} className="mt-6 w-full bg-crm-surface text-crm-text py-3 rounded-xl text-[14px] font-bold border border-crm-border hover:bg-crm-border transition-colors">Try Another Code</button>
 ) : (
 <button onClick={() => { setDiscountScanRequest(null); setScanResult(null); }} className="mt-6 w-full bg-status-confirmed text-crm-bg py-3 rounded-xl text-[14px] font-bold hover:bg-green-400 transition-colors">OK</button>
 )}
 </div>
 ) : (
 <>
 <p className="text-crm-muted mb-8 text-center text-[13px]">
 Please tap the button below and scan your QR code or gift card barcode to apply it to your checkout total.
 </p>
 {isScannerOpen ? (
 typeof document !== 'undefined' ? createPortal(
 <div className="fixed inset-0 z-[100] bg-crm-bg/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
 <BarcodeScanner onScan={handleDiscountScanned} onClose={handleCloseScanner} />
 </div>,
 document.body
 ) : null
 ) : (
 <div className="flex flex-col gap-3 w-full">
 <button 
 onClick={() => setIsScannerOpen(true)}
 className="w-full bg-brand-indigo text-crm-bg font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.4)] animate-pulse hover:scale-105 active:scale-95 transition-all text-base"
 >
 📷 Tap to Open Scanner
 </button>
 <button 
 onClick={handleCloseScanner}
 className="w-full bg-crm-surface border border-crm-border text-crm-text font-bold py-3 rounded-xl hover:bg-crm-border transition-colors text-[13px]"
 >
 Cancel
 </button>
 </div>
 )}
 </>
 )}
 </div>
 ) : userProfile?.shopId ? (
 <div className="flex flex-col items-center z-10 w-full">
 <h3 className="font-bold text-crm-text mb-3 text-center text-lg">Scan ID</h3>
 <p className="text-crm-muted mb-8 md:mb-12 text-center max-w-xs text-[13px]">Staff members, please scan your personal QR code to clock in or out.</p>
 <div className="inline-block bg-crm-surface p-3 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border-4 border-crm-border">
 <BarcodeScannerWrapper shopId={userProfile.shopId} services={[]} />
 </div>
 </div>
 ) : (
 <p className="text-status-cancelled bg-status-cancelled/20 p-4 rounded-lg border border-status-cancelled/30 z-10 text-[13px]">Error: Kiosk not assigned to a shop.</p>
 )}
 </div>

 {/* Lists Section (Right Side on Large Screens) */}
 <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
 
 {/* Clocked In Staff */}
 <div className="flex-1 bg-crm-surface p-6 md:p-8 rounded-3xl border border-crm-border shadow-2xl flex flex-col max-h-[50vh] lg:max-h-[350px]">
 <div className="flex items-center gap-4 mb-6 shrink-0">
 <div className="w-12 h-12 rounded-xl bg-status-info/20 flex items-center justify-center text-2xl border border-status-info/30">👥</div>
 <h3 className="font-serif text-crm-text text-lg font-bold">Currently Clocked In</h3>
 <span className="ml-auto bg-status-info/20 text-status-info px-4 py-1.5 rounded-full text-[13px] font-bold border border-status-info/30">
 {activeLogs.length} Staff
 </span>
 </div>
 
 <div className="flex-grow overflow-y-auto pr-2 scrollbar-hide">
 {isLoadingLogs ? (
 <div className="flex justify-center items-center h-full min-h-[100px]">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-indigo"></div>
 </div>
 ) : activeLogs.length > 0 ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
 {activeLogs.map(log => (
 <div key={log.id} className="bg-crm-surface p-4 rounded-xl flex flex-wrap justify-between gap-x-2 gap-y-2 items-center gap-3 border border-crm-border shadow-sm hover:border-crm-border transition-colors">
 <div className="min-w-0">
 <p className="font-bold text-crm-text truncate text-[13px]">{log.user.name || log.user.email.split('@')[0]}</p>
 <p className="text-crm-muted truncate text-[13px]">{log.user.email}</p>
 </div>
 <div className="text-right shrink-0 bg-crm-surface px-3 py-1.5 rounded-lg border border-crm-border shadow-sm">
 <p className="text-crm-muted uppercase tracking-wider mb-0.5 text-[13px]">In since</p>
 <span className="text-crm-accent font-mono text-base font-bold">
 {new Date(log.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-crm-muted py-8 min-h-[150px]">
 <span className="text-4xl mb-3 opacity-50">📭</span>
 <p className="italic text-[13px]">No staff currently clocked in.</p>
 </div>
 )}
 </div>
 </div>

 {/* Checked-In Clients */}
 <div className="flex-1 bg-crm-surface p-6 md:p-8 rounded-3xl border border-crm-border shadow-2xl flex flex-col max-h-[50vh] lg:max-h-[350px]">
 <div className="flex items-center gap-4 mb-6 shrink-0">
 <div className="w-12 h-12 rounded-xl bg-crm-accent/20 flex items-center justify-center text-2xl border border-crm-accent/30">🛋️</div>
 <h3 className="font-serif text-crm-text text-lg font-bold">Checked-In Clients</h3>
 <span className="ml-auto bg-crm-accent/20 text-crm-accent px-4 py-1.5 rounded-full text-[13px] font-bold border border-crm-accent/30">
 {waitlist.length} Waiting
 </span>
 </div>
 
 <div className="flex-grow overflow-y-auto pr-2 scrollbar-hide">
 {isLoadingLogs ? (
 <div className="flex justify-center items-center h-full min-h-[100px]">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-indigo"></div>
 </div>
 ) : waitlist.length > 0 ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
 {waitlist.map(entry => (
 <div key={entry.id} className={`p-4 rounded-xl flex justify-between items-center gap-3 border ${entry.status === 'SERVING' ? 'bg-status-confirmed/20 border-status-confirmed/30' : 'bg-crm-surface border-crm-border'}`}>
 <div className="flex items-center gap-4 min-w-0">
 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-lg shrink-0 border ${entry.status === 'SERVING' ? 'bg-status-confirmed/20 text-status-confirmed border-status-confirmed/50' : 'bg-crm-surface text-crm-muted border-crm-border'}`}>
 {entry.position}
 </div>
 <div className="min-w-0">
 <p className="font-bold text-crm-text truncate text-[13px]">{entry.clientName}</p>
 <p className="text-crm-muted text-[13px]">Arrived {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
 </div>
 </div>
 <span className={`shrink-0 text-[13px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider ${entry.status === 'SERVING' ? 'bg-status-confirmed/20 text-status-confirmed border border-status-confirmed/30' : 'bg-status-pending/20 text-status-pending border border-status-pending/30'}`}>
 {entry.status}
 </span>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-crm-muted py-8 min-h-[150px]">
 <span className="text-4xl mb-3 opacity-50">✨</span>
 <p className="italic text-[13px]">No clients currently waiting.</p>
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
