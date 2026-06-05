'use client';

import React, { useState } from 'react';

interface MobileNavProps {
  navItems: { label: string; href: string }[];
  className?: string;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
}

export default function MobileNav({
  navItems,
  className = '',
  bgColor = '#ffffff',
  textColor = '#111827',
  accentColor = '#6b7280',
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  if (navItems.length === 0) return null;

  return (
    <div className={`md:hidden ${className}`}>
      {/* Hamburger button */}
      <button
        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg transition-colors"
        style={{ color: accentColor }}
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        )}
      </button>

      {/* Overlay + Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-[998]"
            onClick={() => setOpen(false)}
          />
          {/* Dropdown menu */}
          <div
            className="fixed top-0 right-0 w-[280px] max-w-[85vw] h-full z-[999] shadow-2xl flex flex-col"
            style={{ backgroundColor: bgColor }}
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button
                className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg transition-colors"
                style={{ color: accentColor }}
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {/* Nav links */}
            <nav className="flex flex-col px-4 pb-8">
              {navItems.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="min-h-[44px] flex items-center px-3 py-2 text-sm font-medium tracking-wide uppercase border-b transition-colors"
                  style={{ color: textColor, borderColor: `${accentColor}22` }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
