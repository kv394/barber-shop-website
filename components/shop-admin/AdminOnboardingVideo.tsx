'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// ─── Slide Data ──────────────────────────────────────────────────────────────

interface Slide {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  content: React.ReactNode;
  accentColor: string;
  accentGradient: string;
  duration: number; // seconds per slide in autoplay
}

function createSlides(shopName: string, shopId: string): Slide[] {
  return [
    // ── 1. Welcome ──
    {
      id: 'welcome',
      title: `Welcome to ${shopName}`,
      subtitle: 'Your Complete Shop Management Platform',
      icon: '🎬',
      accentColor: 'from-violet-500 to-indigo-600',
      accentGradient: 'from-violet-500/20 via-indigo-500/10 to-transparent',
      duration: 8,
      content: (
        <div className="space-y-8">
          <p className="text-[15px] text-gray-600 leading-relaxed max-w-xl">
            This guided walkthrough will show you everything you need to know to run your shop like a pro. 
            Let&apos;s get you up to speed in under 5 minutes.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: '📅', label: 'Bookings', desc: 'Manage appointments' },
              { icon: '👥', label: 'Clients', desc: 'Build relationships' },
              { icon: '💇', label: 'Services', desc: 'Configure offerings' },
              { icon: '📊', label: 'Reports', desc: 'Track performance' },
            ].map((item, i) => (
              <div key={i} className="bg-white/80 backdrop-blur rounded-2xl p-4 text-center border border-gray-100 shadow-sm animate-slide-up" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
                <span className="text-3xl block mb-2">{item.icon}</span>
                <p className="text-[13px] font-bold text-gray-800">{item.label}</p>
                <p className="text-[11px] text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 2. Dashboard Overview ──
    {
      id: 'dashboard',
      title: 'Your Dashboard',
      subtitle: 'Everything at a glance',
      icon: '📈',
      accentColor: 'from-blue-500 to-cyan-500',
      accentGradient: 'from-blue-500/20 via-cyan-500/10 to-transparent',
      duration: 10,
      content: (
        <div className="space-y-6">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Your dashboard is the command center. Here&apos;s what you&apos;ll see every day:
          </p>

          {/* Mock stats */}
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Bookings', value: '12', color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100' },
              { label: 'Revenue', value: '$840', color: 'text-emerald-500', bg: 'bg-emerald-50 border-emerald-100' },
              { label: 'Tips', value: '$95', color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
              { label: 'Completed', value: '8', color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100' },
              { label: 'Upcoming', value: '4', color: 'text-cyan-500', bg: 'bg-cyan-50 border-cyan-100' },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border rounded-xl p-3 text-center animate-slide-up`} style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="bg-white/80 border border-gray-100 rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Needs Attention</span>
              </div>
              <p className="text-[13px] text-gray-700 font-medium">Shows your next appointment and any low-stock alerts</p>
            </div>
            <div className="bg-white/80 border border-gray-100 rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.85s' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">Insights</span>
              </div>
              <p className="text-[13px] text-gray-700 font-medium">AI-powered inventory forecasts and business analytics</p>
            </div>
          </div>
        </div>
      ),
    },

    // ── 3. Navigation ──
    {
      id: 'navigation',
      title: 'Navigating the Sidebar',
      subtitle: 'Find anything in seconds',
      icon: '🧭',
      accentColor: 'from-orange-500 to-red-500',
      accentGradient: 'from-orange-500/20 via-red-500/10 to-transparent',
      duration: 10,
      content: (
        <div className="space-y-5">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            The left sidebar is your main navigation. Here are the key sections:
          </p>
          <div className="space-y-2">
            {[
              { icon: '📊', label: 'Dashboard', desc: 'Daily overview, stats, next appointments, and alerts', path: '' },
              { icon: '📅', label: 'Bookings', desc: 'View, manage, and filter all appointments by date and staff', path: '/bookings' },
              { icon: '⏱️', label: 'Waitlist', desc: 'Walk-in queue management for busy days', path: '/waitlist' },
              { icon: '👥', label: 'Clients', desc: 'Client profiles, history, notes, allergies, and preferences', path: '/clients' },
              { icon: '🏷️', label: 'Team', desc: 'Staff availability, working hours, and portfolio', path: '/settings/team' },
              { icon: '📸', label: 'Portfolio', desc: 'Showcase your team\'s best work', path: '/portfolio' },
              { icon: '📈', label: 'Reports', desc: 'Revenue, commissions, working hours, and expenses', path: '/reports' },
              { icon: '❤️', label: 'Engage', desc: 'Loyalty programs, campaigns, gift cards, and reviews', path: '/engagement' },
              { icon: '⚙️', label: 'Settings', desc: 'Services, products, booking rules, billing, and more', path: '/settings' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/80 border border-gray-100 rounded-xl px-4 py-3 animate-slide-left" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
                <span className="text-xl w-8 text-center shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-800">{item.label}</p>
                  <p className="text-[11px] text-gray-500 truncate">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 4. Managing Bookings ──
    {
      id: 'bookings',
      title: 'Managing Bookings',
      subtitle: 'Your daily schedule at a glance',
      icon: '📅',
      accentColor: 'from-blue-500 to-indigo-500',
      accentGradient: 'from-blue-500/20 via-indigo-500/10 to-transparent',
      duration: 10,
      content: (
        <div className="space-y-5">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            The Bookings page shows all appointments. You can filter by date, staff, and status.
          </p>

          {/* Mock booking list */}
          <div className="bg-white/80 border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Today&apos;s Schedule</span>
              <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">5 bookings</span>
            </div>
            {[
              { time: '9:00 AM', name: 'James Wilson', service: 'Classic Fade', status: 'Completed', statusColor: 'bg-emerald-100 text-emerald-700' },
              { time: '10:00 AM', name: 'Mike Johnson', service: 'Beard Trim', status: 'Completed', statusColor: 'bg-emerald-100 text-emerald-700' },
              { time: '11:30 AM', name: 'Alex Chen', service: 'Hair + Beard', status: 'In Progress', statusColor: 'bg-blue-100 text-blue-700' },
              { time: '1:00 PM', name: 'David Park', service: 'Taper Fade', status: 'Upcoming', statusColor: 'bg-amber-100 text-amber-700' },
              { time: '2:30 PM', name: 'Chris Brown', service: 'Kids Cut', status: 'Upcoming', statusColor: 'bg-amber-100 text-amber-700' },
            ].map((appt, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0 animate-slide-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <span className="text-[12px] font-mono font-bold text-gray-400 w-16 shrink-0">{appt.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-800">{appt.name}</p>
                  <p className="text-[11px] text-gray-500">{appt.service}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${appt.statusColor}`}>{appt.status}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            {['Mark Complete', 'Reschedule', 'Cancel', 'No-Show'].map((action, i) => (
              <span key={i} className="text-[11px] bg-white border border-gray-200 px-3 py-1.5 rounded-full font-medium text-gray-600 animate-slide-up" style={{ animationDelay: `${0.8 + i * 0.1}s` }}>
                {action}
              </span>
            ))}
          </div>
        </div>
      ),
    },

    // ── 5. Client Management ──
    {
      id: 'clients',
      title: 'Client Management',
      subtitle: 'Build lasting relationships',
      icon: '👥',
      accentColor: 'from-emerald-500 to-teal-500',
      accentGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      duration: 10,
      content: (
        <div className="space-y-5">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Every client has a detailed profile. Track their preferences, formulas, and visit history.
          </p>

          {/* Mock client card */}
          <div className="bg-white/80 border border-gray-100 rounded-xl p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-lg">JW</div>
              <div>
                <p className="text-[15px] font-bold text-gray-800">James Wilson</p>
                <p className="text-[12px] text-gray-500">12 visits • Last: 3 days ago</p>
              </div>
              <span className="ml-auto text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded-full font-bold border border-amber-100">VIP</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-400 font-medium">Preferred:</span>
                <span className="ml-1 text-gray-700 font-bold">Fade + Beard</span>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-gray-400 font-medium">Allergies:</span>
                <span className="ml-1 text-gray-700 font-bold">None</span>
              </div>
              <div className="bg-gray-50 rounded-lg px-3 py-2 col-span-2">
                <span className="text-gray-400 font-medium">Notes:</span>
                <span className="ml-1 text-gray-700 font-bold">Prefers #2 guard on sides, tapered neckline</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Client Notes', icon: '📝', desc: 'Hair preferences, formulas' },
              { label: 'Visit History', icon: '📋', desc: 'Every past appointment' },
              { label: 'Before/After', icon: '📸', desc: 'Photo documentation' },
            ].map((feature, i) => (
              <div key={i} className="bg-white/80 border border-gray-100 rounded-xl p-3 text-center animate-slide-up" style={{ animationDelay: `${0.5 + i * 0.15}s` }}>
                <span className="text-2xl block mb-1">{feature.icon}</span>
                <p className="text-[11px] font-bold text-gray-800">{feature.label}</p>
                <p className="text-[10px] text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 6. Services & Products ──
    {
      id: 'services',
      title: 'Services & Products',
      subtitle: 'Configure what you offer',
      icon: '✂️',
      accentColor: 'from-purple-500 to-pink-500',
      accentGradient: 'from-purple-500/20 via-pink-500/10 to-transparent',
      duration: 10,
      content: (
        <div className="space-y-5">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Set up your services with pricing, duration, and tax rates. Go to <strong>Settings → Services</strong>.
          </p>

          <div className="bg-white/80 border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Your Services</span>
            </div>
            {[
              { name: 'Classic Haircut', price: '$35', duration: '30 min', emoji: '💇‍♂️' },
              { name: 'Fade + Beard', price: '$55', duration: '45 min', emoji: '✂️' },
              { name: 'Kids Cut', price: '$25', duration: '20 min', emoji: '👦' },
              { name: 'Hot Towel Shave', price: '$30', duration: '25 min', emoji: '🪒' },
              { name: 'Hair Color', price: '$80', duration: '90 min', emoji: '🎨' },
            ].map((svc, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0 animate-slide-up" style={{ animationDelay: `${0.2 + i * 0.08}s` }}>
                <span className="text-lg">{svc.emoji}</span>
                <div className="flex-1"><p className="text-[13px] font-bold text-gray-800">{svc.name}</p></div>
                <span className="text-[12px] font-mono font-bold text-emerald-600">{svc.price}</span>
                <span className="text-[11px] text-gray-400 font-medium">{svc.duration}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <p className="text-[12px] font-bold text-purple-700 mb-1">💡 Pro Tip</p>
            <p className="text-[12px] text-purple-600">Add <strong>buffer minutes</strong> between appointments to give barbers time to clean up. Set <strong>processing time</strong> for color services.</p>
          </div>
        </div>
      ),
    },

    // ── 7. Team Management ──
    {
      id: 'team',
      title: 'Team Management',
      subtitle: 'Your staff, their schedule',
      icon: '🏷️',
      accentColor: 'from-amber-500 to-orange-500',
      accentGradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      duration: 10,
      content: (
        <div className="space-y-5">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Add staff members, set their working hours, commission rates, and manage availability.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'Marcus Rivera', role: 'Barber', status: 'On Shift', avatar: 'MR', color: 'from-orange-400 to-red-500' },
              { name: 'Kenji Tanaka', role: 'Senior Barber', status: 'Off Today', avatar: 'KT', color: 'from-blue-400 to-indigo-500' },
              { name: 'Devon Williams', role: 'Booth Renter', status: 'On Shift', avatar: 'DW', color: 'from-emerald-400 to-teal-500' },
              { name: 'Alex Santos', role: 'Junior Barber', status: 'Break', avatar: 'AS', color: 'from-purple-400 to-pink-500' },
            ].map((member, i) => (
              <div key={i} className="bg-white/80 border border-gray-100 rounded-xl p-4 flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${0.2 + i * 0.12}s` }}>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold text-[12px]`}>{member.avatar}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-800">{member.name}</p>
                  <p className="text-[11px] text-gray-500">{member.role}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${member.status === 'On Shift' ? 'bg-emerald-50 text-emerald-600' : member.status === 'Break' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                  {member.status}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Working Hours', desc: 'Set each barber\'s schedule' },
              { label: 'Commission', desc: 'Track service & product commissions' },
              { label: 'Time Tracking', desc: 'Clock in/out & timesheets' },
            ].map((item, i) => (
              <div key={i} className="bg-white/80 border border-gray-100 rounded-xl p-3 text-center animate-slide-up" style={{ animationDelay: `${0.7 + i * 0.1}s` }}>
                <p className="text-[11px] font-bold text-gray-800">{item.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 8. Engagement ──
    {
      id: 'engagement',
      title: 'Engagement & Marketing',
      subtitle: 'Keep clients coming back',
      icon: '❤️',
      accentColor: 'from-pink-500 to-rose-500',
      accentGradient: 'from-pink-500/20 via-rose-500/10 to-transparent',
      duration: 10,
      content: (
        <div className="space-y-5">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            The Engagement hub has powerful tools to retain and grow your client base.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: '💎', label: 'Loyalty Program', desc: 'Earn points per visit, redeem for discounts', color: 'bg-violet-50 border-violet-100 text-violet-700' },
              { icon: '🎁', label: 'Gift Cards', desc: 'Sell digital gift cards clients can share', color: 'bg-pink-50 border-pink-100 text-pink-700' },
              { icon: '📣', label: 'Campaigns', desc: 'Email & SMS marketing to clients', color: 'bg-blue-50 border-blue-100 text-blue-700' },
              { icon: '🔗', label: 'Referrals', desc: 'Reward clients who bring friends', color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
              { icon: '⭐', label: 'Reviews', desc: 'Collect & showcase client reviews', color: 'bg-amber-50 border-amber-100 text-amber-700' },
              { icon: '📱', label: 'AI Social', desc: 'AI-generated social media content', color: 'bg-cyan-50 border-cyan-100 text-cyan-700' },
            ].map((tool, i) => (
              <div key={i} className={`${tool.color} border rounded-xl p-4 text-center animate-slide-up`} style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
                <span className="text-2xl block mb-2">{tool.icon}</span>
                <p className="text-[12px] font-bold">{tool.label}</p>
                <p className="text-[10px] opacity-80 mt-0.5">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 9. Reports ──
    {
      id: 'reports',
      title: 'Reports & Analytics',
      subtitle: 'Know your numbers',
      icon: '📊',
      accentColor: 'from-cyan-500 to-blue-500',
      accentGradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      duration: 10,
      content: (
        <div className="space-y-5">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Track every aspect of your business with detailed reports.
          </p>

          {/* Mock chart */}
          <div className="bg-white/80 border border-gray-100 rounded-xl p-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-4">Weekly Revenue</p>
            <div className="flex items-end gap-2 h-24">
              {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-cyan-400 animate-grow-up" 
                    style={{ height: `${h}%`, animationDelay: `${0.3 + i * 0.08}s` }} />
                  <span className="text-[9px] text-gray-400 font-medium">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Sales Overview', desc: 'Revenue breakdown by service, product, and staff' },
              { label: 'Commissions', desc: 'Auto-calculated payroll for each team member' },
              { label: 'Working Hours', desc: 'Clock-in/out logs and total hours worked' },
              { label: 'Expenses', desc: 'Track shop expenses and calculate net profit' },
            ].map((report, i) => (
              <div key={i} className="bg-white/80 border border-gray-100 rounded-xl p-3 animate-slide-up" style={{ animationDelay: `${0.6 + i * 0.1}s` }}>
                <p className="text-[12px] font-bold text-gray-800 mb-0.5">{report.label}</p>
                <p className="text-[10px] text-gray-500">{report.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 10. Settings ──
    {
      id: 'settings',
      title: 'Settings & Configuration',
      subtitle: 'Customize everything',
      icon: '⚙️',
      accentColor: 'from-slate-500 to-gray-700',
      accentGradient: 'from-slate-500/20 via-gray-500/10 to-transparent',
      duration: 10,
      content: (
        <div className="space-y-5">
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Fine-tune your shop with these configuration areas:
          </p>

          <div className="space-y-2">
            {[
              { section: 'Setup', items: [
                { label: 'Services', desc: 'Add, edit, price your services' },
                { label: 'Products', desc: 'Track inventory with low-stock alerts' },
                { label: 'Booking & Hours', desc: 'Set shop hours, booking rules, and time slots' },
                { label: 'Dynamic Pricing', desc: 'Surge/discount pricing for peak/off-peak times' },
              ]},
              { section: 'Experience', items: [
                { label: 'Appearance', desc: 'Customize your public booking page theme' },
                { label: 'Memberships', desc: 'Create membership tiers with recurring benefits' },
                { label: 'Intake Forms', desc: 'Custom forms for new client onboarding' },
              ]},
              { section: 'Operations', items: [
                { label: 'Commissions', desc: 'Set commission rules per staff member' },
                { label: 'Notifications', desc: 'Email/SMS alerts for bookings and reminders' },
                { label: 'Billing', desc: 'Manage your subscription and payment methods' },
              ]},
            ].map((group, gi) => (
              <div key={gi} className="animate-slide-up" style={{ animationDelay: `${0.2 + gi * 0.2}s` }}>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">{group.section}</p>
                <div className="bg-white/80 border border-gray-100 rounded-xl overflow-hidden">
                  {group.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                      <p className="text-[12px] font-bold text-gray-800 w-28 shrink-0">{item.label}</p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },

    // ── 11. Wrap-up ──
    {
      id: 'wrapup',
      title: "You're All Set! 🎉",
      subtitle: 'Start managing your shop like a pro',
      icon: '🚀',
      accentColor: 'from-emerald-500 to-green-600',
      accentGradient: 'from-emerald-500/20 via-green-500/10 to-transparent',
      duration: 8,
      content: (
        <div className="space-y-6">
          <p className="text-[15px] text-gray-600 leading-relaxed">
            You now know the essentials! Here&apos;s a quick checklist to get started:
          </p>

          <div className="space-y-2">
            {[
              { step: '1', label: 'Set up your services and pricing', path: `/shop/${shopId}/config/services` },
              { step: '2', label: 'Add your team members and set their hours', path: `/shop/${shopId}/settings/team` },
              { step: '3', label: 'Configure your booking page appearance', path: `/shop/${shopId}/settings` },
              { step: '4', label: 'Share your booking link with clients', path: `/shop/${shopId}` },
              { step: '5', label: 'Set up loyalty and engagement tools', path: `/shop/${shopId}/engagement` },
            ].map((item, i) => (
              <Link key={i} href={item.path} className="flex items-center gap-4 bg-white/80 border border-gray-100 rounded-xl px-4 py-3 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group animate-slide-up" style={{ animationDelay: `${0.2 + i * 0.12}s` }}>
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 text-white font-black text-[13px] flex items-center justify-center shrink-0">{item.step}</span>
                <p className="text-[13px] font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">{item.label}</p>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            ))}
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl p-4 animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <p className="text-[13px] font-bold text-emerald-700">💡 Need help?</p>
            <p className="text-[12px] text-emerald-600 mt-1">Use the AI chat assistant in the bottom-right corner anytime. It knows your shop data and can help with anything!</p>
          </div>
        </div>
      ),
    },
  ];
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminOnboardingVideo({ shopName, shopId }: { shopName: string; shopId: string }) {
  const slides = createSlides(shopName, shopId);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const slide = slides[currentSlide];
  const totalDuration = slides.reduce((s, sl) => s + sl.duration, 0);
  const elapsedBefore = slides.slice(0, currentSlide).reduce((s, sl) => s + sl.duration, 0);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  }, []);

  const goTo = useCallback((idx: number) => {
    clearTimers();
    setCurrentSlide(idx);
    setProgress(0);
    setIsPlaying(false);
  }, [clearTimers]);

  const next = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(c => c + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
      clearTimers();
    }
  }, [currentSlide, slides.length, clearTimers]);

  const prev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(c => c - 1);
      setProgress(0);
    }
  }, [currentSlide]);

  // Autoplay logic
  useEffect(() => {
    clearTimers();
    if (!isPlaying) return;

    const dur = slide.duration * 1000;
    const step = 50; // update progress every 50ms

    progressRef.current = setInterval(() => {
      setProgress(p => {
        const next = p + (step / dur) * 100;
        return next >= 100 ? 100 : next;
      });
    }, step);

    intervalRef.current = setTimeout(() => {
      next();
    }, dur);

    return clearTimers;
  }, [isPlaying, currentSlide, slide.duration, next, clearTimers]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      clearTimers();
    } else {
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href={`/shop/${shopId}/training`} className="flex items-center gap-2 text-crm-muted hover:text-crm-text text-[13px] font-bold transition-colors group">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-1"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Training
      </Link>

      {/* Video player container */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Slide content area */}
        <div className="relative min-h-[500px] sm:min-h-[520px]">
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${slide.accentGradient} transition-all duration-700`} />
          
          {/* Content */}
          <div className="relative z-10 p-6 sm:p-8" key={slide.id}>
            {/* Slide header */}
            <div className="mb-6 animate-slide-down">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{slide.icon}</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{slide.title}</h2>
                  {slide.subtitle && <p className="text-[13px] text-gray-500 font-medium">{slide.subtitle}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-gradient-to-r ${slide.accentColor} text-white`}>
                  {currentSlide + 1} / {slides.length}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {formatTime(elapsedBefore)} / {formatTime(totalDuration)}
                </span>
              </div>
            </div>

            {/* Slide body */}
            <div className="animate-fade-in">
              {slide.content}
            </div>
          </div>
        </div>

        {/* Controls bar */}
        <div className="border-t border-gray-100 bg-gray-50/80 backdrop-blur">
          {/* Progress bar */}
          <div className="h-1 bg-gray-200 relative">
            {/* Overall progress */}
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-300 to-gray-300 transition-all duration-300"
              style={{ width: `${((currentSlide) / slides.length) * 100}%` }} />
            {/* Current slide progress */}
            <div className={`absolute inset-y-0 bg-gradient-to-r ${slide.accentColor} transition-all ${isPlaying ? '' : 'duration-300'}`}
              style={{ left: `${(currentSlide / slides.length) * 100}%`, width: `${(progress / 100) * (1 / slides.length) * 100}%` }} />
          </div>

          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
              {isPlaying ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-700 ml-0.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              )}
            </button>

            {/* Prev / Next */}
            <button onClick={prev} disabled={currentSlide === 0} className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button onClick={next} disabled={currentSlide === slides.length - 1} className="p-2 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>

            {/* Current slide title */}
            <span className="text-[12px] font-bold text-gray-500 flex-1 truncate hidden sm:block">
              {slide.title}
            </span>

            {/* Slide dots / timeline */}
            <div className="flex items-center gap-1">
              {slides.map((s, i) => (
                <button key={s.id} onClick={() => goTo(i)} title={s.title}
                  className={`transition-all rounded-full ${
                    i === currentSlide ? `w-6 h-2 bg-gradient-to-r ${s.accentColor}` :
                    i < currentSlide ? 'w-2 h-2 bg-gray-400' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
                  }`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chapter list */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-2xl p-5">
        <h3 className="text-[13px] font-black text-gray-500 uppercase tracking-widest mb-3">Chapters</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {slides.map((s, i) => (
            <button key={s.id} onClick={() => goTo(i)}
              className={`text-left px-3 py-2.5 rounded-xl text-[12px] transition-all ${
                i === currentSlide 
                  ? 'bg-crm-primary/10 text-crm-primary font-bold border border-crm-primary/20' 
                  : i < currentSlide 
                    ? 'bg-gray-50 text-gray-600 font-medium hover:bg-gray-100' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}>
              <span className="flex items-center gap-2">
                <span className="text-sm">{s.icon}</span>
                <span className="truncate">{s.title}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes growUp {
          from { height: 0%; }
        }
        .animate-slide-up {
          opacity: 0;
          animation: slideUp 0.5s ease-out forwards;
        }
        .animate-slide-down {
          opacity: 0;
          animation: slideDown 0.4s ease-out forwards;
        }
        .animate-slide-left {
          opacity: 0;
          animation: slideLeft 0.4s ease-out forwards;
        }
        .animate-fade-in {
          opacity: 0;
          animation: fadeIn 0.6s ease-out 0.1s forwards;
        }
        .animate-grow-up {
          animation: growUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
