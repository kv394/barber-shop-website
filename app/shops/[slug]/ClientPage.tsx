'use client';;
import Image from 'next/image';

import CustomTemplate from './templates/CustomTemplate';import DynamicTemplate from './templates/DynamicTemplate';import SportyTemplate from './templates/SportyTemplate';import CorporateTemplate from './templates/CorporateTemplate';import NoirTemplate from './templates/NoirTemplate';import SunsetTemplate from './templates/SunsetTemplate';import EditorialTemplate from './templates/EditorialTemplate';import MinimalTemplate from './templates/MinimalTemplate';import ClassicTemplate from './templates/ClassicTemplate';import ModernTemplate from './templates/ModernTemplate';

import { useState, useEffect } from 'react';
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

 // Skip non-booking links (sign-in, sign-out, my-appointments, etc.)
 if (href.includes('/sign-in') || href.includes('/logout') || href.includes('/my-appointments')) return;
 if (text.includes('sign in') || text.includes('sign out') || text.includes('my appointments')) return;

 // Only intercept booking-related actions
 if (text.includes('book') || (text.includes('appointment') && !text.includes('my'))) {
 e.preventDefault();
 // Try to find a specific service based on data attribute, fallback to the first service
 const serviceId = button.getAttribute('data-service-id');
 const service = shop.services?.find((s: any) => s.id === serviceId) || shop.services?.[0];

 if (typeof window !== 'undefined' && (window as any).BarberBooking) {
 (window as any).BarberBooking.open(service?.id);
 } else if (typeof window !== 'undefined' && (window as any).openKutzAppChat) {
 (window as any).openKutzAppChat(service?.name);
 } else if (service) {
 setSelectedService(service);
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

 const normalizeImageUrl = (url: string | null): string | null => {
 if (!url) return null;
 const fileMatch = url.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
 if (fileMatch) return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
 const openMatch = url.match(/drive\.google\.com\/open\?id=([^&]+)/);
 if (openMatch) return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
 const ucMatch = url.match(/drive\.google\.com\/uc\?.*id=([^&]+)/);
 if (ucMatch) return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
 return url;
 };

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
 shopWebsite, shopAddress, shopFB, shopIG, shopTW, logoUrl, heroImageUrl, authButton, pathname
 };
 if (templateType === 'custom' && dynamicTemplateHtml) return <DynamicTemplate ctx={ctx} />;
 if (templateType === 'custom') return <CustomTemplate ctx={ctx} />;
 if (dynamicTemplateHtml) return <DynamicTemplate ctx={ctx} />;
 if (templateType === 'sporty') return <SportyTemplate ctx={ctx} />;
 if (templateType === 'corporate') return <CorporateTemplate ctx={ctx} />;
 if (templateType === 'noir') return <NoirTemplate ctx={ctx} />;
 if (templateType === 'sunset') return <SunsetTemplate ctx={ctx} />;
 if (templateType === 'editorial') return <EditorialTemplate ctx={ctx} />;
 if (templateType === 'minimal') return <MinimalTemplate ctx={ctx} />;
 if (templateType === 'classic') return <ClassicTemplate ctx={ctx} />;
 
 // Default 'modern' template (Redesigned)
 return <ModernTemplate ctx={ctx} />;
}
