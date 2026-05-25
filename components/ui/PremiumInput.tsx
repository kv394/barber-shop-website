import React from 'react';

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function PremiumInput({ label, error, icon, className = "", ...props }: PremiumInputProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block font-semibold text-crm-muted text-[13px] uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-crm-muted">
            {icon}
          </div>
        )}
        <input 
          {...props}
          className={`w-full bg-crm-bg/50 backdrop-blur-sm border ${error ? 'border-red-500' : 'border-white/10'} shadow-inner rounded-xl ${icon ? 'pl-11 pr-4' : 'px-4'} py-3 text-crm-text focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-crm-primary'} transition-all focus:border-transparent outline-none placeholder:text-crm-muted/50`} 
        />
      </div>
      {error && <p className="text-red-500 text-[11px] font-bold mt-1">{error}</p>}
    </div>
  );
}
