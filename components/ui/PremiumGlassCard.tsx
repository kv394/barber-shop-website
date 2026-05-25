export default function PremiumGlassCard({ 
  children, 
  className = "", 
  accentColor = "brand-gold" 
}: { 
  children: React.ReactNode; 
  className?: string;
  accentColor?: "brand-gold" | "crm-primary" | "emerald-500" | "red-500" | "cyan-500";
}) {
  const gradientMap = {
    "brand-gold": "from-brand-gold to-brand-gold/50",
    "crm-primary": "from-crm-primary to-crm-primary/80",
    "emerald-500": "from-emerald-500 to-emerald-400",
    "red-500": "from-red-500 to-red-400",
    "cyan-500": "from-cyan-500 to-cyan-400",
  };

  return (
    <div className={`bg-white/5 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] relative overflow-hidden ${className}`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradientMap[accentColor]}`}></div>
      {children}
    </div>
  );
}
