'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MyAppointmentsNav() {
  const pathname = usePathname();

  const links = [
    { href: '/my-appointments', label: 'Appointments', icon: '📅' },
    { href: '/my-appointments/profile', label: 'Profile', icon: '👤' },
    { href: '/my-appointments/loyalty', label: 'Loyalty', icon: '⭐' },
    { href: '/my-appointments/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/my-appointments/referrals', label: 'Referrals', icon: '🔗' },
  ];

  return (
    <nav className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex sm:flex-wrap gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-2 sm:pb-0">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-brand-gold text-brand-dark shadow-lg shadow-brand-gold/20' 
                  : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/5'
              }`}
            >
              <span>{link.icon}</span> {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
