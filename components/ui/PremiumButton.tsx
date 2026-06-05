import Image from 'next/image';
import React from 'react';

export default function PremiumButton({
 children,
 onClick,
 type = "button",
 disabled = false,
 variant = "primary",
 className = "",
 icon = null
}: {
 children: React.ReactNode;
 onClick?: () => void;
 type?: "button" | "submit" | "reset";
 disabled?: boolean;
 variant?: "primary" | "secondary" | "danger";
 className?: string;
 icon?: React.ReactNode;
}) {
 const baseClasses = "px-6 py-2.5 rounded-full font-black uppercase tracking-wider text-[13px] transition-all shrink-0 border border-white/10 shadow-lg flex items-center justify-center gap-2";
 
 const variants = {
 primary: "bg-gradient-to-r from-crm-primary to-crm-primary/80 text-white hover:shadow-[0_0_20px_rgba(var(--color-crm-primary),0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none",
 secondary: "bg-white/5 backdrop-blur-md text-crm-text hover:bg-white/10 hover:text-white hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
 danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
 };

 return (
 <button
 type={type}
 onClick={onClick}
 disabled={disabled}
 className={`${baseClasses} ${variants[variant]} ${className}`}
 >
 {icon && <span>{icon}</span>}
 {children}
 </button>
 );
}
