'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Caption {
  /** Seconds from start when this caption appears */
  time: number;
  /** The text to display */
  text: string;
  /** Optional emoji icon */
  icon?: string;
}

interface CaptionedVideoPlayerProps {
  /** Path to the animated WebP file */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Title shown in the player chrome */
  title: string;
  /** Total duration of the animation in seconds */
  duration: number;
  /** Timed captions to overlay */
  captions: Caption[];
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CaptionedVideoPlayer({ src, alt, title, duration, captions }: CaptionedVideoPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(captions[0] || null);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  // Find the active caption based on elapsed time
  const findCaption = useCallback((t: number): Caption | null => {
    let active: Caption | null = null;
    for (const cap of captions) {
      if (t >= cap.time) active = cap;
      else break;
    }
    return active;
  }, [captions]);

  // Animation frame loop for precise timing
  const tick = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = Date.now();
    const newElapsed = (now - startTimeRef.current) / 1000;
    
    if (newElapsed >= duration) {
      // Loop: restart from beginning
      startTimeRef.current = now;
      setElapsed(0);
      setCurrentCaption(captions[0] || null);
    } else {
      setElapsed(newElapsed);
      setCurrentCaption(findCaption(newElapsed));
    }
    
    rafRef.current = requestAnimationFrame(tick);
  }, [duration, findCaption, captions]);

  // Start when visible (IntersectionObserver)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  // Start the timer when the image element is added to DOM and visible
  useEffect(() => {
    if (!isVisible) return;

    // Small delay to let the browser start rendering the animation
    const timeout = setTimeout(() => {
      startTimeRef.current = Date.now();
      rafRef.current = requestAnimationFrame(tick);
    }, 200);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible, tick]);

  const progress = (elapsed / duration) * 100;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-gray-950">
      {/* Window chrome */}
      <div className="bg-gray-900 px-4 py-2 flex items-center gap-3">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500" />
          <span className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-[11px] text-gray-400 font-mono flex-1 truncate">📹 {title}</span>
        <span className="text-[10px] text-gray-500 font-mono">{formatTime(elapsed)} / {formatTime(duration)}</span>
      </div>

      {/* Video area */}
      <div className="relative">
        {/* Loading placeholder */}
        {!isVisible && (
          <div className="aspect-video bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[12px] text-gray-400 font-medium">Scroll down to load...</p>
            </div>
          </div>
        )}

        {/* The animated WebP — only rendered when visible */}
        {isVisible && (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className="w-full block"
            loading="eager"
          />
        )}

        {/* Caption overlay */}
        {currentCaption && isVisible && (
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div 
              key={currentCaption.time}
              className="bg-black/80 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10"
              style={{ animation: 'captionIn 0.3s ease-out' }}
            >
              <p className="text-white text-[13px] sm:text-[14px] font-medium leading-relaxed">
                {currentCaption.icon && <span className="mr-2">{currentCaption.icon}</span>}
                {currentCaption.text}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-gray-900 px-4 py-2.5">
        <div className="h-1.5 bg-gray-700 rounded-full relative">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
          {/* Caption markers */}
          {captions.map((cap, i) => (
            <div
              key={i}
              className="absolute top-1/2 -translate-y-1/2 w-1 h-1 bg-white/40 rounded-full"
              style={{ left: `${(cap.time / duration) * 100}%` }}
              title={cap.text}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-gray-500 font-mono">{formatTime(elapsed)}</span>
          <span className="text-[10px] text-gray-500">💬 {captions.length} captions • loops automatically</span>
          <span className="text-[10px] text-gray-500 font-mono">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Caption animation styles */}
      <style jsx>{`
        @keyframes captionIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Caption Data for Each Video ─────────────────────────────────────────────
// Timestamps are based on each recording's actual frame timing:
// - Each page navigation takes ~3s (browser subagent waits 3s between clicks)
// - Recordings use 10fps (100ms per frame)
// - Captions are placed at the exact moment each page becomes visible

export const VIDEO_CAPTIONS = {
  // Video 1: 94.9s — Dashboard (0-25s), Bookings (25-55s), Clients (55-95s)
  dashboard: [
    { time: 0, text: 'This is the Admin Dashboard — your daily command center showing all key metrics', icon: '📊' },
    { time: 6, text: 'Today\'s Overview: bookings count, revenue, tips, completed and upcoming appointments', icon: '📈' },
    { time: 14, text: 'The sidebar on the left lets you navigate to every section of the admin console', icon: '🧭' },
    { time: 22, text: 'Insights panel shows AI-powered recommendations and inventory alerts', icon: '🤖' },
    { time: 30, text: 'Now viewing the Bookings page — your daily appointment schedule', icon: '📅' },
    { time: 38, text: 'Each booking card shows client name, service, barber, time, and price', icon: '💇' },
    { time: 46, text: 'Click "+ Add Booking" to create a new appointment. Use date picker to jump to any date', icon: '➕' },
    { time: 54, text: 'Actions: Mark Complete, Reschedule, Cancel, or flag as No-Show', icon: '✅' },
    { time: 62, text: 'Now viewing the Clients page — your complete client directory', icon: '👥' },
    { time: 70, text: 'Search clients by name, email, or barcode. Each client has a unique QR code', icon: '🔍' },
    { time: 78, text: 'Visit count and last visit date help identify your most loyal clients', icon: '⭐' },
    { time: 86, text: 'Click any client row to see their full profile: preferences, history, and notes', icon: '📋' },
  ] as Caption[],

  // Video 2: 81.3s — Team (0-35s), Portfolio (35-55s), Training (55-70s), Waitlist (70-81s)
  team: [
    { time: 0, text: 'Staff Availability — see who\'s working today with the timeline view', icon: '👨‍💼' },
    { time: 8, text: 'Green "AVAIL" badges show open booking slots. Timeline runs in 30-minute blocks', icon: '✅' },
    { time: 16, text: 'Use the date picker to check any day\'s schedule. Toggle between TIMELINE and CARDS view', icon: '📅' },
    { time: 24, text: 'Cards view shows individual staff profiles with their role and current status', icon: '👤' },
    { time: 32, text: 'Click "+ Onboard Staff" to add a new team member with their schedule', icon: '➕' },
    { time: 40, text: 'Portfolio page — showcase your team\'s best work. Photos appear on your public website', icon: '📸' },
    { time: 48, text: 'Upload before/after photos, tag the barber and service for each portfolio item', icon: '🖼️' },
    { time: 56, text: 'Training page — create training modules with lessons and quizzes for your staff', icon: '📖' },
    { time: 64, text: 'Each module has difficulty levels, lessons, and quiz questions to test knowledge', icon: '🎓' },
    { time: 72, text: 'Waitlist page — manage walk-in clients when all slots are booked', icon: '⏰' },
    { time: 78, text: 'Add walk-ins to the queue. They\'re converted to bookings when slots open up', icon: '📋' },
  ] as Caption[],

  // Video 3: 65.4s — Reports Overview (0-20s), then sub-pages ~8s each
  reports: [
    { time: 0, text: 'Reports Overview — Total Revenue, Tips, Completed count, and Average Ticket', icon: '📈' },
    { time: 7, text: 'Three tabs: Transactions (every sale), By Staff (per barber), By Service type', icon: '📋' },
    { time: 14, text: '"Export CSV" downloads data for your accountant. "AI Insights" gives trend analysis', icon: '📤' },
    { time: 21, text: 'Now viewing Commissions — tracks each barber\'s earnings by service', icon: '💸' },
    { time: 28, text: 'Set commission rates per service or as a percentage. View payout history', icon: '💰' },
    { time: 35, text: 'Working Hours — staff clock-in/out logs and total hours per week', icon: '⏰' },
    { time: 42, text: 'Integrates with Payroll for accurate pay calculations. Export for accounting', icon: '📊' },
    { time: 49, text: 'Expenses — log business costs by category: rent, supplies, utilities, marketing', icon: '🧾' },
    { time: 54, text: 'Booth Rent — manage chair rental agreements and track monthly payments', icon: '🏢' },
    { time: 60, text: 'Capital & Financing — financial projections, loan tracking, and cash flow', icon: '🏦' },
  ] as Caption[],

  // Video 4: 84.6s — Engage Dashboard (0-12s), then sub-pages ~7s each
  engage: [
    { time: 0, text: 'Engage Dashboard — your marketing & client engagement overview with key metrics', icon: '❤️' },
    { time: 8, text: 'Engage has 10 powerful sub-features for growing and retaining your client base', icon: '🚀' },
    { time: 15, text: 'AI Chat — automated chatbot responds to client questions 24/7 via your website', icon: '🤖' },
    { time: 22, text: 'Customize the AI personality and responses to match your brand voice', icon: '✏️' },
    { time: 29, text: 'SMS Reminders — automated appointment reminders that reduce no-shows by 80%', icon: '📱' },
    { time: 36, text: 'Loyalty Program — clients earn points per visit, redeem for discounts', icon: '⭐' },
    { time: 43, text: 'Set up tiers (Bronze, Silver, Gold) with increasing perks and rewards', icon: '🏆' },
    { time: 50, text: 'Referral Program — reward clients who bring friends with referral codes', icon: '🔗' },
    { time: 57, text: 'Campaigns — send targeted email/SMS blasts to client segments', icon: '📣' },
    { time: 64, text: 'AI Social Media — auto-generate social posts from your portfolio photos', icon: '📲' },
    { time: 71, text: 'Gift Cards — sell digital gift cards clients can purchase and send to friends', icon: '🎁' },
    { time: 78, text: 'Reviews — monitor client feedback. Reply within 24 hours for best results', icon: '⭐' },
  ] as Caption[],

  // Video 5: 56.1s — Settings sub-pages Part 1 (Setup + Experience groups)
  settings1: [
    { time: 0, text: 'Settings → Services — add, edit, and price all your services with durations', icon: '✂️' },
    { time: 7, text: 'Set service categories, tax rates, buffer times, and assign to specific barbers', icon: '⚙️' },
    { time: 14, text: 'Settings → Products — manage retail inventory with low-stock alerts', icon: '🛍️' },
    { time: 21, text: 'Settings → Booking & Hours — set shop business hours and booking rules', icon: '📅' },
    { time: 28, text: 'Configure time slot intervals, max advance booking, and cancellation policies', icon: '🕐' },
    { time: 35, text: 'Settings → Dynamic Pricing — surge pricing for peak hours, discounts for slow times', icon: '💹' },
    { time: 42, text: 'Settings → Appearance — customize your public booking page theme and colors', icon: '🎨' },
    { time: 49, text: 'Settings → Memberships — create recurring membership tiers with monthly perks', icon: '🏆' },
  ] as Caption[],

  // Video 6: 153.4s — Settings sub-pages Part 2 (Operations + extras)
  settings2: [
    { time: 0, text: 'Settings → Intake Forms — custom questionnaires for new client onboarding', icon: '📝' },
    { time: 12, text: 'Settings → Commissions — set commission rules per staff member and service type', icon: '💸' },
    { time: 24, text: 'Settings → Alerts — configure email/SMS notification preferences', icon: '🔔' },
    { time: 36, text: 'Settings → Billing — manage your KutzApp subscription and payment methods', icon: '💳' },
    { time: 48, text: 'Settings → Resources — manage chairs, stations, rooms and equipment', icon: '🏗️' },
    { time: 60, text: 'Settings → Hardware Store — order POS systems and card readers', icon: '🖥️' },
    { time: 72, text: 'Settings → Wholesale Marketplace — bulk ordering for supplies and products', icon: '📦' },
    { time: 84, text: 'Settings → Staff Kiosk — set up a clock-in/clock-out station for your team', icon: '⏱️' },
    { time: 96, text: 'Staff can clock in with PIN codes. Integrates with Working Hours and Payroll', icon: '👨‍💼' },
    { time: 108, text: 'Settings → Front Desk Kiosk — client self-check-in with QR codes', icon: '🖥️' },
    { time: 120, text: 'Clients scan their QR code on arrival. Staff sees them in the queue instantly', icon: '🔲' },
    { time: 132, text: 'Settings → SDK Docs — API documentation for custom integrations', icon: '🔧' },
    { time: 144, text: 'That covers all 16 Settings sub-pages across Setup, Experience, and Operations!', icon: '✅' },
  ] as Caption[],
};
