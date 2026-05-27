import React from 'react';

export default function PremiumBadge({ 
 children, 
 variant = "info" 
}: { 
 children: React.ReactNode; 
 variant?: "success" | "warning" | "error" | "info" | "neutral" 
}) {
 const variants = {
 success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
 warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
 error: "bg-red-500/20 text-red-400 border-red-500/30",
 info: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
 neutral: "bg-white/10 text-white/70 border-white/20",
 };

 return (
 <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md ${variants[variant]}`}>
 {children}
 </span>
 );
}
