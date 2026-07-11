'use client';
import React, { useState, useEffect } from 'react';
import CaptionedVideoPlayer, { VIDEO_CAPTIONS } from './CaptionedVideoPlayer';

export default function TrainingClient({ shopId, userRole }: { shopId: string; userRole: string }) {
  const isAdmin = userRole === 'SHOP_ADMIN' || userRole === 'SITE_ADMIN';
  const [mounted, setMounted] = useState(false);
  const [openVideoId, setOpenVideoId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-page-in">
      {/* KutzApp Admin Training Videos */}
      {isAdmin ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <div>
              <h3 className="text-[16px] font-black text-crm-text tracking-tight">KutzApp Admin Training</h3>
              <p className="text-[12px] text-crm-muted">Watch animated walkthroughs with live captions explaining every feature</p>
            </div>
          </div>

          {[
            {
              id: 'vid-dashboard',
              title: '📊 Dashboard, Bookings & Clients',
              desc: 'Navigate the dashboard, manage appointments, search clients',
              src: '/training-videos/01-dashboard-bookings-clients.webp',
              alt: 'Dashboard, Bookings and Clients walkthrough',
              playerTitle: 'Dashboard, Bookings & Clients',
              duration: 94.9,
              captions: VIDEO_CAPTIONS.dashboard,
            },
            {
              id: 'vid-team',
              title: '👨‍💼 Team, Portfolio & Training',
              desc: 'Staff availability timeline, portfolio showcase, training modules',
              src: '/training-videos/02-team-portfolio-training.webp',
              alt: 'Team, Portfolio and Training walkthrough',
              playerTitle: 'Team, Portfolio & Training',
              duration: 81.3,
              captions: VIDEO_CAPTIONS.team,
            },
            {
              id: 'vid-reports',
              title: '📈 Reports & All Sub-Menus',
              desc: 'Revenue overview, commissions, working hours, expenses, booth rent',
              src: '/training-videos/03-reports-all-submenus.webp',
              alt: 'Reports and all sub-menus walkthrough',
              playerTitle: 'Reports & All Sub-Menus',
              duration: 65.4,
              captions: VIDEO_CAPTIONS.reports,
            },
            {
              id: 'vid-engage',
              title: '❤️ Engage & All Sub-Menus',
              desc: 'AI Chat, SMS, loyalty, referrals, campaigns, reviews & more',
              src: '/training-videos/04-engage-all-submenus.webp',
              alt: 'Engage and all sub-menus walkthrough',
              playerTitle: 'Engage & All Sub-Menus',
              duration: 84.6,
              captions: VIDEO_CAPTIONS.engage,
            },
            {
              id: 'vid-settings1',
              title: '⚙️ Settings — Setup & Experience',
              desc: 'Services, Products, Booking Hours, Dynamic Pricing, Appearance, Memberships',
              src: '/training-videos/05-settings-all-submenus.webp',
              alt: 'Settings Setup and Experience sub-pages walkthrough',
              playerTitle: 'Settings — Setup & Experience',
              duration: 56.1,
              captions: VIDEO_CAPTIONS.settings1,
            },
            {
              id: 'vid-settings2',
              title: '🔧 Settings — Operations & More',
              desc: 'Commissions, Alerts, Billing, Kiosks, Resources, Hardware, Wholesale, SDK',
              src: '/training-videos/06-settings-more-submenus.webp',
              alt: 'Settings Operations and additional sub-pages walkthrough',
              playerTitle: 'Settings — Operations & More',
              duration: 153.4,
              captions: VIDEO_CAPTIONS.settings2,
            },
          ].map((vid) => (
            <div key={vid.id} className="bg-white/40 border border-white/30 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div 
                className="cursor-pointer flex items-center gap-4 px-5 py-4 select-none"
                onClick={() => setOpenVideoId(openVideoId === vid.id ? null : vid.id)}
              >
                <span className="text-lg">{vid.title.split(' ')[0]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-crm-text">{vid.title.slice(vid.title.indexOf(' ') + 1)}</p>
                  <p className="text-[11px] text-crm-muted">{vid.desc}</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`text-crm-muted transition-transform shrink-0 ${openVideoId === vid.id ? 'rotate-90' : ''}`}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </div>
              {openVideoId === vid.id && (
                <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <CaptionedVideoPlayer
                    src={vid.src}
                    alt={vid.alt}
                    title={vid.playerTitle}
                    duration={vid.duration}
                    captions={vid.captions}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-2xl border border-dashed border-white/20">
          <span className="text-5xl mb-4 opacity-50 drop-shadow-md">🎓</span>
          <p className="text-crm-muted text-[15px] font-medium max-w-[300px] mx-auto mb-2">
            Training is coming soon.
          </p>
        </div>
      )}
    </div>
  );
}
