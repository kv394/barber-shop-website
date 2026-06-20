'use client';
import Image from 'next/image';

import CustomTemplate from './templates/CustomTemplate';import DynamicTemplate from './templates/DynamicTemplate';import SportyTemplate from './templates/SportyTemplate';import CorporateTemplate from './templates/CorporateTemplate';import NoirTemplate from './templates/NoirTemplate';import SunsetTemplate from './templates/SunsetTemplate';import EditorialTemplate from './templates/EditorialTemplate';import MinimalTemplate from './templates/MinimalTemplate';import ClassicTemplate from './templates/ClassicTemplate';import ModernTemplate from './templates/ModernTemplate';

import { useState, useEffect } from 'react';
import { normalizeGoogleDriveUrl } from '@/lib/image-utils';
import dynamic from 'next/dynamic';
import SupabaseAuthButton from '@/components/auth/SupabaseAuthButton';
import { usePathname } from 'next/navigation';
import InteractiveReviewsSection from '@/components/reviews/InteractiveReviewsSection';


// Lazy-load the BookingModal component
const BookingModal = dynamic(() => import('@/components/appointments/BookingModal'), {
 ssr: false, // This component will only be rendered on the client side
 loading: () => <div className="fixed inset-0 bg-crm-surface z-[100] flex items-center justify-center"><p className="text-crm-muted text-[13px]">Loading...</p></div>
});

const BookingWizard = dynamic(() => import('@/components/booking/BookingWizard'), {
 ssr: false,
 loading: () => <div className="h-full w-full flex flex-col items-center justify-center bg-crm-bg"><p className="text-crm-muted">Loading booking portal...</p></div>
});

/** Format the address object (or legacy string) into a single readable line */
import { formatAddress } from './components/utils';
import ReviewsSection from './components/ReviewsSection';
import CustomPageContent from './components/CustomPageContent';
export default function ClientPage({ shop, templateType, primaryColor, secondaryColor, sportRed, reviews = [], dynamicTemplateHtml, dynamicTemplateCss }: any) {
 const [selectedService, setSelectedService] = useState<any | null>(null);
 const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
 const pathname = usePathname() || '/';

 const handleBookClick = (service: any) => {
 if (typeof window !== 'undefined' && (window as any).BarberBooking) {
 (window as any).BarberBooking.open(service?.id);
 } else if (typeof window !== 'undefined' && (window as any).openKutzAppChat) {
 (window as any).openKutzAppChat(service?.name);
 } else {
 setSelectedService(service);
 }
 };

 // Click handler for dynamically generated templates where we can't easily attach React handlers to string HTML.
 const handleDynamicTemplateClick = (e: React.MouseEvent) => {
 const target = e.target as HTMLElement;
 const button = target.closest('button') || target.closest('a');
 if (!button) return;

 const text = button.innerText.toLowerCase();
 const href = button.getAttribute('href') || '';
 const elId = button.getAttribute('id') || '';

 // Skip sign-in/sign-out links
 if (href.includes('/sign-in') || href.includes('/logout')) return;
 if (text.includes('sign in') || text.includes('sign out')) return;

 // Intercept "My Appointments" clicks → open pop-up instead of navigating
 if (
 href.includes('/my-appointments') ||
 text.includes('my appointments') ||
 elId === 'auth-appointments' ||
 elId === 'mobile-appointments'
 ) {
 e.preventDefault();
 // Try the template's own modal function first (e.g. heritage template)
 if (typeof window !== 'undefined' && typeof (window as any).openAppointmentsModal === 'function') {
 (window as any).openAppointmentsModal();
 } else {
 setShowAppointmentsModal(true);
 }
 return;
 }

 // Only intercept booking-related actions
 if (text.includes('book') || (text.includes('appointment') && !text.includes('my'))) {
  // If the element has its own onclick handler (dynamically rendered cards via
  // template scripts bypass the sanitizer), let it handle the booking directly.
  // Only intercept clicks on sanitized elements that lost their onclick handlers.
  if (button.hasAttribute('onclick')) return;

  e.preventDefault();
  // Extract service and staff IDs from data attributes (set by template scripts)
  const serviceId = button.getAttribute('data-service-id');
  const staffId = button.getAttribute('data-staff-id');

  if (typeof window !== 'undefined' && (window as any).BarberBooking) {
   // Pass both IDs — the BookingWizard will skip steps based on what's provided:
   // - serviceId only → skip to staff selection
   // - staffId only → stay on service selection (staff pre-locked)
   // - neither → start from beginning
   (window as any).BarberBooking.open(serviceId || null, staffId || null);
  } else if (typeof window !== 'undefined' && (window as any).openKutzAppChat) {
   const service = shop.services?.find((s: any) => s.id === serviceId) || shop.services?.[0];
   (window as any).openKutzAppChat(service?.name);
  } else {
   const service = shop.services?.find((s: any) => s.id === serviceId) || shop.services?.[0];
   if (service) setSelectedService(service);
  }
 }
 };
 // ── Normalised contact helpers (supports both old flat shape and new nested shape) ──
 
 
 const c = shop.customization || {};
 const headingFont = c.headingFont || c.fontFamily || 'Inter';
 const bodyFont = c.bodyFont || c.fontFamily || 'Inter';
 const buttonShape = c.buttonShape || 'rounded';
 const buttonVariant = c.buttonVariant || 'solid';
 const colorTheme = c.colorTheme || 'light';
 const headerStyle = c.headerStyle || 'classic';
 const heroLayout = c.heroLayout || 'full';
 const heroOverlayOpacity = c.heroOverlayOpacity !== undefined ? c.heroOverlayOpacity : 0;
 const heroOverlayColor = c.heroOverlayColor || '#000000';
 const enableScrollAnimations = c.enableScrollAnimations || false;
 const faviconUrl = c.faviconUrl || null;
 const customCss = c.customCss || '';
 const sectionOrder = c.sectionOrder || ['hero', 'services', 'team', 'gallery', 'reviews', 'contact'];

 const isDark = colorTheme === 'dark';
 const themeBg = isDark ? '#121212' : '#ffffff';
 const themeText = isDark ? '#ffffff' : '#111827';
 const themeMuted = isDark ? '#a1a1aa' : '#6b7280';
 const themeBorder = isDark ? '#27272a' : '#e5e7eb';
 
 const pages = c.pages || [];
 const fontFamily = c.fontFamily || 'Inter';
 const ctaText = c.ctaText || 'Book';
 const announcement = c.announcement;
 const heroVideoUrl = c.heroVideoUrl;
 const shopPhone = c.contact?.phone || c.phone || '';
 const shopEmail = c.contact?.email || c.email || '';
 const shopWebsite = c.contact?.website || c.website || '';
 const shopAddress = formatAddress(c.address);
 const shopFB = c.contact?.facebook || c.social?.facebook || '';
 const shopIG = c.contact?.instagram || c.social?.instagram || '';
 const shopTW = c.contact?.twitter || c.social?.twitter || '';

 const normalizeImageUrl = normalizeGoogleDriveUrl;

 const logoUrl = normalizeImageUrl(c.logoUrl) || null;
 const heroImageUrl = normalizeImageUrl(c.heroImageUrl || c.bannerUrl) || null;

 

 // Auth button for client sign-in/out
 const authButton = (
 <div className="absolute top-6 right-6 z-50">
 <SupabaseAuthButton redirectUrl={pathname} primaryColor={primaryColor} secondaryColor={secondaryColor} />
 </div>
 );

 

 const ctx = {
 shop, templateType, primaryColor, secondaryColor, sportRed, reviews, dynamicTemplateHtml, dynamicTemplateCss,
 selectedService, setSelectedService, handleBookClick, handleDynamicTemplateClick,
 c, headingFont, bodyFont, buttonShape, buttonVariant, colorTheme, headerStyle,
 heroLayout, heroOverlayOpacity, heroOverlayColor, enableScrollAnimations,
 faviconUrl, customCss, sectionOrder, isDark, themeBg, themeText, themeMuted, themeBorder,
 pages, fontFamily, ctaText, announcement, heroVideoUrl, shopPhone, shopEmail,
 shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton, pathname,
 showAppointmentsModal, setShowAppointmentsModal
 };

 const appointmentsModal = showAppointmentsModal ? (
 <div
 className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
 style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
 onClick={() => setShowAppointmentsModal(false)}
 >
 <div
 className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
 style={{ height: '85vh', maxHeight: '750px', background: '#ffffff', border: '1px solid rgba(0,0,0,0.1)' }}
 onClick={e => e.stopPropagation()}
 >
 <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
 <span className="font-bold text-gray-800 text-base">📋 My Appointments</span>
 <button
 onClick={() => setShowAppointmentsModal(false)}
 className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-900 transition-colors text-sm font-bold"
 >✕</button>
 </div>
 <iframe
 src="/my-appointments"
 className="w-full border-none bg-white"
 style={{ height: 'calc(100% - 52px)' }}
 title="My Appointments"
 />
 </div>
 </div>
 ) : null;

 let templateComponent;
 if (templateType === 'custom' && dynamicTemplateHtml) templateComponent = <DynamicTemplate ctx={ctx} />;
 else if (templateType === 'custom') templateComponent = <CustomTemplate ctx={ctx} />;
 else if (dynamicTemplateHtml) templateComponent = <DynamicTemplate ctx={ctx} />;
 else if (templateType === 'sporty') templateComponent = <SportyTemplate ctx={ctx} />;
 else if (templateType === 'corporate') templateComponent = <CorporateTemplate ctx={ctx} />;
 else if (templateType === 'noir') templateComponent = <NoirTemplate ctx={ctx} />;
 else if (templateType === 'sunset') templateComponent = <SunsetTemplate ctx={ctx} />;
 else if (templateType === 'editorial') templateComponent = <EditorialTemplate ctx={ctx} />;
 else if (templateType === 'minimal') templateComponent = <MinimalTemplate ctx={ctx} />;
 else if (templateType === 'classic') templateComponent = <ClassicTemplate ctx={ctx} />;
 else templateComponent = <ModernTemplate ctx={ctx} />;
 
 return (
 <>
 {templateComponent}
 {appointmentsModal}
 </>
 );
}
