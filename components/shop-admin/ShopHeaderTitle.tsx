"use client";
import { usePathname } from 'next/navigation';

export default function ShopHeaderTitle() {
  const pathname = usePathname() || '';
  
  // Extract the segment after the shop ID
  // Path format: /shop/[shopId]/[segment]/...
  const parts = pathname.split('/');
  
  let title = 'Dashboard';

  if (parts.length >= 4) {
    const segment = parts[3];
    const subSegment = parts[4];
    
    switch (segment) {
      case 'bookings': title = 'Bookings'; break;
      case 'waitlist': title = 'Waitlist'; break;
      case 'clients': title = 'Clients'; break;
      case 'settings':
        if (subSegment === 'team') title = 'Team & Availability';
        else if (subSegment === 'booking') title = 'Booking Settings';
        else if (subSegment === 'resources') title = 'Resources';
        else if (subSegment === 'forms') title = 'Forms';
        else if (subSegment === 'memberships') title = 'Memberships';
        else if (subSegment === 'notifications') title = 'Notifications';
        else if (subSegment === 'commissions') title = 'Commission Setup';
        else if (subSegment === 'kiosk') title = 'Kiosk Settings';
        else if (subSegment === 'billing') title = 'Billing';
        else title = 'Settings';
        break;
      case 'portfolio': title = 'Portfolio'; break;
      case 'engagement': title = 'Analytics'; break;
      case 'loyalty': title = 'Loyalty'; break;
      case 'referrals': title = 'Referrals'; break;
      case 'campaigns': title = 'Campaigns'; break;
      case 'gift-cards': title = 'Gift Cards'; break;
      case 'reviews': title = 'Reviews'; break;
      case 'reports': 
        if (subSegment === 'staff-working') title = 'Staff Performance';
        else if (subSegment === 'commissions') title = 'Commissions';
        else title = 'Financial';
        break;
      case 'expenses': title = 'Expenses'; break;
      case 'config':
        if (subSegment === 'services') title = 'Services';
        else if (subSegment === 'products') title = 'Products';
        else title = 'Configuration';
        break;
      case 'staff': title = 'My Schedule'; break;
      case 'leave': title = 'My Leave'; break;
      case 'profile': title = 'Profile'; break;
      default:
        // Capitalize the segment as a fallback
        title = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    }
  }

  return <h1 className="font-semibold text-xl text-crm-text">{title}</h1>;
}