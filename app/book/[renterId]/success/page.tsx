'use client';;
import Image from 'next/image';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function BookingSuccessPage() {
 const { renterId } = useParams<{ renterId: string }>();

 return (
 <div className="min-h-screen bg-gradient-to-br from-[#0f0c09] via-[#1a1410] to-[#0a0806] flex items-center justify-center px-4">
 <div className="max-w-sm w-full text-center space-y-6">
 <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400/50 flex items-center justify-center text-5xl mx-auto shadow-lg shadow-emerald-500/20">
 ✅
 </div>
 <div>
 <h1 className="text-2xl font-black text-white mb-2">You&apos;re Booked!</h1>
 <p className="text-white/50 text-[14px] leading-relaxed">
 Your appointment is confirmed. Check your email for a confirmation receipt.
 </p>
 </div>
 <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-2 text-[13px]">
 <p className="text-white/40 text-[11px] uppercase tracking-wider font-bold">What&apos;s next</p>
 <p className="text-white/70">• You&apos;ll receive a confirmation email from Stripe</p>
 <p className="text-white/70">• Show up at your scheduled time — no further action needed</p>
 <p className="text-white/70">• Need to reschedule? Contact your stylist directly</p>
 </div>
 <Link
 href={`/book/${renterId}`}
 className="block w-full py-4 bg-amber-500 hover:bg-amber-400 text-crm-text font-black rounded-2xl transition-colors text-[15px]"
 >
 Book Another Appointment
 </Link>
 </div>
 </div>
 );
}
