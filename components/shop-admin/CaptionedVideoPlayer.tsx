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
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [currentCaption, setCurrentCaption] = useState<Caption | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const startTimeRef = useRef<number>(0);

  // Find the active caption based on elapsed time
  const findCaption = useCallback((t: number): Caption | null => {
    let active: Caption | null = null;
    for (const cap of captions) {
      if (t >= cap.time) active = cap;
      else break;
    }
    return active;
  }, [captions]);

  // Start/stop the timer
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      // Pause
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsPlaying(false);
    } else {
      // Play / Resume
      startTimeRef.current = Date.now() - (elapsed * 1000);
      setIsPlaying(true);
    }
  }, [isPlaying, elapsed]);

  // Reset to beginning
  const restart = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setElapsed(0);
    setCurrentCaption(captions[0] || null);
    startTimeRef.current = Date.now();
    setIsPlaying(true);
  }, [captions]);

  // Timer effect
  useEffect(() => {
    if (!isPlaying) return;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const newElapsed = (now - startTimeRef.current) / 1000;
      
      if (newElapsed >= duration) {
        // Animation ended
        setElapsed(duration);
        setIsPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }

      setElapsed(newElapsed);
      setCurrentCaption(findCaption(newElapsed));
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, duration, findCaption]);

  // Auto-start when image loads
  const handleImageLoad = useCallback(() => {
    setIsLoaded(true);
    setCurrentCaption(captions[0] || null);
    startTimeRef.current = Date.now();
    setIsPlaying(true);
  }, [captions]);

  const progress = (elapsed / duration) * 100;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-gray-950 group">
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
        {/* Loading state */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
              <p className="text-[12px] text-gray-400 font-medium">Loading recording...</p>
            </div>
          </div>
        )}

        {/* The animated WebP */}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="w-full block"
          onLoad={handleImageLoad}
          loading="lazy"
        />

        {/* Caption overlay */}
        {currentCaption && isLoaded && (
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div 
              key={currentCaption.text}
              className="bg-black/80 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 animate-caption-in"
            >
              <p className="text-white text-[13px] sm:text-[14px] font-medium leading-relaxed">
                {currentCaption.icon && <span className="mr-2">{currentCaption.icon}</span>}
                {currentCaption.text}
              </p>
            </div>
          </div>
        )}

        {/* Play/Pause overlay button */}
        <button
          onClick={togglePlay}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </button>
      </div>

      {/* Progress bar & controls */}
      <div className="bg-gray-900 px-4 py-2">
        {/* Progress bar */}
        <div className="h-1.5 bg-gray-700 rounded-full mb-2 cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const newTime = pct * duration;
            setElapsed(newTime);
            setCurrentCaption(findCaption(newTime));
            startTimeRef.current = Date.now() - (newTime * 1000);
          }}
        >
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md border border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: `translate(-50%, -50%)` }}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors" title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            )}
          </button>
          <button onClick={restart} className="text-gray-400 hover:text-white transition-colors" title="Restart">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <span className="flex-1" />
          {/* Caption indicator */}
          {currentCaption && (
            <span className="text-[10px] text-gray-500 font-medium truncate max-w-[200px]">
              💬 Captions ON
            </span>
          )}
        </div>
      </div>

      {/* Caption animation styles */}
      <style jsx>{`
        @keyframes captionIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-caption-in {
          animation: captionIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// ─── Caption Data for Each Video ─────────────────────────────────────────────

export const VIDEO_CAPTIONS = {
  dashboard: [
    { time: 0, text: 'Welcome to the Admin Dashboard — your daily command center', icon: '📊' },
    { time: 5, text: 'The sidebar on the left lets you navigate to every section of the admin console', icon: '🧭' },
    { time: 12, text: 'Hovering over sidebar icons reveals the section name. Click any icon to navigate.', icon: '👆' },
    { time: 18, text: 'The Dashboard shows today\'s stats: revenue, bookings, tips, and upcoming appointments', icon: '📈' },
    { time: 25, text: 'Scrolling down reveals more widgets and insights for your day', icon: '⬇️' },
    { time: 32, text: 'Now clicking into the Bookings page to manage appointments...', icon: '📅' },
    { time: 38, text: 'Each booking card shows: time, client name, service, barber, and price', icon: '💇' },
    { time: 45, text: 'Click "+ Add Booking" (orange button) to create a new appointment manually', icon: '➕' },
    { time: 52, text: 'Use "Jump to specific date" to check availability for future dates', icon: '📅' },
    { time: 60, text: 'Now navigating to the Clients page — your complete client directory', icon: '👥' },
    { time: 66, text: 'Each client has a unique QR code for self-check-in at your kiosk', icon: '🔲' },
    { time: 72, text: 'The search bar filters clients instantly — by name, email, or barcode ID', icon: '🔍' },
    { time: 80, text: 'Visit count and last visit date help identify your most loyal clients', icon: '⭐' },
    { time: 88, text: 'Click any client row to view their full profile with preferences and history', icon: '📋' },
  ] as Caption[],

  team: [
    { time: 0, text: 'Staff Availability — see who\'s working and when', icon: '👨‍💼' },
    { time: 6, text: 'The timeline view shows all staff side-by-side with 30-minute slots', icon: '📊' },
    { time: 12, text: 'Green "AVAIL" badges indicate open slots where clients can book', icon: '✅' },
    { time: 18, text: 'Use the date picker at the top to check any day\'s schedule', icon: '📅' },
    { time: 24, text: 'Toggle between TIMELINE and CARDS view for different perspectives', icon: '🔄' },
    { time: 30, text: 'Cards view shows individual staff profiles with their details', icon: '👤' },
    { time: 37, text: 'Click "+ Onboard Staff" to add a new team member', icon: '➕' },
    { time: 44, text: 'Now navigating to the Portfolio page...', icon: '📁' },
    { time: 50, text: 'Portfolio showcases your team\'s best work — visible on your public website', icon: '📸' },
    { time: 58, text: 'Now visiting the Training page — where admins create modules for staff', icon: '📖' },
    { time: 64, text: 'You can create training modules with lessons, videos, and quizzes', icon: '🎓' },
    { time: 70, text: 'Now checking the Waitlist — for managing walk-in clients', icon: '⏰' },
    { time: 76, text: 'Walk-ins are queued here and converted to bookings when slots open', icon: '📋' },
  ] as Caption[],

  reports: [
    { time: 0, text: 'Reports Overview — your financial command center', icon: '📈' },
    { time: 5, text: 'Top metrics: Total Revenue, Tips, Completed appointments, Avg Ticket', icon: '💰' },
    { time: 10, text: 'Three tabs: Transactions (every sale), By Staff (per barber), By Service', icon: '📋' },
    { time: 16, text: 'Click "Export CSV" to download data for your accountant', icon: '📤' },
    { time: 20, text: 'The "AI Insights" button (purple) provides automated trend analysis', icon: '✨' },
    { time: 26, text: 'Now clicking into the Commissions sub-page...', icon: '💸' },
    { time: 31, text: 'Commissions tracks each barber\'s earnings with per-service or percentage rates', icon: '💰' },
    { time: 36, text: 'Now viewing Working Hours — staff clock-in/out logs', icon: '⏰' },
    { time: 41, text: 'Working Hours integrates with Payroll for accurate pay calculations', icon: '📊' },
    { time: 46, text: 'Now checking the Expenses sub-page...', icon: '🧾' },
    { time: 50, text: 'Log expenses by category: rent, supplies, utilities, marketing', icon: '📝' },
    { time: 55, text: 'Booth Rent sub-page — manage chair rental agreements and payments', icon: '🏢' },
    { time: 60, text: 'Capital & Financing — financial projections and loan tracking', icon: '🏦' },
  ] as Caption[],

  engage: [
    { time: 0, text: 'Engage Dashboard — your marketing & client engagement overview', icon: '❤️' },
    { time: 6, text: 'The Engage section has 10 powerful sub-features for growth', icon: '🚀' },
    { time: 12, text: 'AI Chat — automated chatbot responds to client questions 24/7', icon: '🤖' },
    { time: 18, text: 'Customize the AI\'s personality and responses to match your brand', icon: '✏️' },
    { time: 24, text: 'SMS Reminders — automated appointment reminders reduce no-shows by 80%', icon: '📱' },
    { time: 30, text: 'Loyalty Program — clients earn points per visit, redeem for discounts', icon: '⭐' },
    { time: 36, text: 'Set up tiers (Bronze, Silver, Gold) with increasing perks', icon: '🏆' },
    { time: 42, text: 'Referrals — reward clients who bring friends with referral codes', icon: '🔗' },
    { time: 48, text: 'Campaigns — send targeted email/SMS blasts to client segments', icon: '📣' },
    { time: 54, text: 'AI Social Media — auto-generate social posts from your portfolio photos', icon: '📲' },
    { time: 60, text: 'Gift Cards — digital gift cards clients can purchase and send to friends', icon: '🎁' },
    { time: 66, text: 'Games — spin-the-wheel promotions and loyalty challenges', icon: '🎮' },
    { time: 72, text: 'Reviews — monitor client feedback with star ratings and written reviews', icon: '⭐' },
    { time: 78, text: 'Reply to every review within 24 hours — the "unanswered" badge helps track this', icon: '💬' },
  ] as Caption[],
};
