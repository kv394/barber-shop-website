'use client';;
import Image from 'next/image';

import React, { useState } from 'react';

interface CapitalOfferCardProps {
  eligibleAmount: number;
  repaymentRate: number; // Percentage
  feeAmount: number; // Flat fee or based on eligible amount
}

export default function CapitalOfferCard({ eligibleAmount, repaymentRate, feeAmount }: CapitalOfferCardProps) {
  const [selectedAmount, setSelectedAmount] = useState<number>(Math.floor(eligibleAmount / 2));

  // Determine the proportion to adjust fee if needed, or assume feeAmount is for the max amount
  const calculatedFee = Math.round((selectedAmount / eligibleAmount) * feeAmount);
  const totalRepayment = selectedAmount + calculatedFee;

  const handleRequestFunds = () => {
    alert(`Request for $${selectedAmount.toLocaleString()} submitted successfully!`);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-gray-700">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 opacity-20 blur-3xl mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 opacity-20 blur-3xl mix-blend-screen pointer-events-none"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
        <div className="flex-1 space-y-6">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-orange-400 font-bold mb-2">Pre-approved Offer</h2>
            <div className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Up to {formatCurrency(eligibleAmount)}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              Based on your shop's recent performance. No credit check required.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">Select Amount</p>
                <div className="text-3xl font-semibold">{formatCurrency(selectedAmount)}</div>
              </div>
            </div>
            
            <input 
              type="range" 
              min={1000} 
              max={eligibleAmount} 
              step={500}
              value={selectedAmount} 
              onChange={(e) => setSelectedAmount(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <div className="flex justify-between text-xs font-medium text-gray-500 mt-3">
              <span>{formatCurrency(1000)}</span>
              <span>{formatCurrency(eligibleAmount)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between shadow-inner">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 border-b border-white/10 pb-3">Repayment Details</h3>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Principal</span>
              <span className="font-semibold text-gray-200">{formatCurrency(selectedAmount)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">One-time Fee</span>
              <span className="font-semibold text-gray-200">{formatCurrency(calculatedFee)}</span>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-2">
              <span className="text-gray-300 font-medium">Total Repayment</span>
              <span className="text-2xl font-bold text-white">{formatCurrency(totalRepayment)}</span>
            </div>

            <div className="flex justify-between items-center mt-4 p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <span className="text-orange-300 text-sm font-semibold">Daily Deduction</span>
              <span className="font-bold text-orange-400">{repaymentRate}% of sales</span>
            </div>
          </div>

          <button 
            onClick={handleRequestFunds}
            className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(234,88,12,0.3)] hover:shadow-[0_0_30px_rgba(234,88,12,0.5)] border border-orange-400/50"
          >
            Request Funds
          </button>
        </div>
      </div>
    </div>
  );
}
