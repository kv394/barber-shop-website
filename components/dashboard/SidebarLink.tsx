"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function SidebarLink({ 
  href, 
  label, 
  exact = false,
  icon
}: { 
  href: string; 
  label: string; 
  exact?: boolean;
  icon?: React.ReactNode;
}) {
  const pathname = usePathname() || '';
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-6 py-2 text-sm transition-colors border-l-4 ${
        isActive
          ? 'text-crm-darkBase font-semibold border-crm-primary'
          : 'text-crm-muted hover:text-crm-darkBase border-transparent'
      }`}
    >
      {icon && (
        <span className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-crm-darkBase' : 'text-crm-muted'}`}>
          {icon}
        </span>
      )}
      {label}
    </Link>
  );
}