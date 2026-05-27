"use client";

import React from 'react';

export default function HardwareClient() {
  const handleBuy = () => {
    alert("Hardware order requested. Our team will contact you shortly.");
  };

  return (
    <div className="relative overflow-hidden bg-black text-white rounded-3xl p-8 md:p-16 border border-zinc-800 shadow-2xl">
      {/* Premium Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 z-0"></div>
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 z-0 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-900/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 z-0 pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
          Hardware & Accessories
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12">
          Elevate your barbershop experience with the KutzApp Starter Kit. Designed for modern professionals.
        </p>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 rounded-2xl p-8 w-full max-w-3xl flex flex-col md:flex-row items-center gap-8 shadow-xl">
          <div className="flex-1 text-left space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">KutzApp Starter Kit</h2>
              <p className="text-zinc-400 text-sm">Everything you need to run a modern, efficient shop front.</p>
            </div>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <div>
                  <span className="block font-medium text-zinc-200">Premium iPad Kiosk Stand</span>
                  <span className="block text-xs text-zinc-500">Anti-Theft, Rotatable, Sleek Aluminum</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <div>
                  <span className="block font-medium text-zinc-200">Wireless Barcode Scanner</span>
                  <span className="block text-xs text-zinc-500">Perfect for quick product inventory and sales</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <div>
                  <span className="block font-medium text-zinc-200">Stripe Tap-to-Pay Terminal</span>
                  <span className="block text-xs text-zinc-500">Accept Apple Pay, Google Pay, and all major cards</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex-shrink-0 bg-zinc-950 rounded-2xl p-6 border border-zinc-800 text-center w-full md:w-64 flex flex-col justify-center items-center h-full">
            <span className="text-xs font-bold text-orange-500 tracking-widest uppercase mb-2">Special Bundle</span>
            <div className="text-5xl font-black text-white mb-6">$499<span className="text-xl text-zinc-500">.00</span></div>
            <button
              onClick={handleBuy}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(234,88,12,0.4)]"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
