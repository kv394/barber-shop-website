export interface BookingSuccessScreenProps {
  themeColor?: string;
  serviceName: string;
  formattedDate: string;
  selectedTime: string;
  confirmedStaffName: string;
  totalDuration: number;
  totalPrice: number;
  selectedAddons: { id: string; name: string; price: number; durationMin: number }[];
  onClose: () => void;
  onAddToCalendar: () => void;
}

export function BookingSuccessScreen({
  themeColor,
  serviceName,
  formattedDate,
  selectedTime,
  confirmedStaffName,
  totalDuration,
  totalPrice,
  selectedAddons,
  onClose,
  onAddToCalendar
}: BookingSuccessScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-crm-surface rounded-xl p-8 max-w-md w-full border border-status-confirmed shadow-2xl text-center relative">
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-4 bg-crm-surface hover:bg-gray-100 shadow-sm z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]" style={{ color: themeColor || "#111827" }}>✕</button>
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="font-bold text-crm-primary mb-2 text-lg">Booking Confirmed!</h3>
        <p className="text-crm-muted mb-2 text-[13px]">The appointment for <span className="text-crm-accent font-semibold">{serviceName}</span> has been scheduled.</p>
        
        <div className="bg-crm-surface rounded-lg p-4 mb-6 border border-crm-border shadow-sm text-[13px] text-left space-y-1">
          <p className="text-crm-muted text-[13px]">📅 <span className="text-crm-text">{formattedDate}</span></p>
          <p className="text-crm-muted text-[13px]">🕐 <span className="text-crm-text">{selectedTime}</span></p>
          <p className="text-crm-muted text-[13px]">💈 <span className="text-crm-text">{confirmedStaffName}</span></p>
          <p className="text-crm-muted text-[13px]">⏱️ <span className="text-crm-text">{totalDuration} mins</span></p>
          <p className="text-crm-muted text-[13px]">💰 <span className="text-crm-text">${totalPrice.toFixed(2)}</span></p>
          {selectedAddons.length > 0 && (
            <div className="mt-2 pt-2 border-t border-crm-border">
              <p className="text-crm-muted text-[12px] mb-1">Add-ons:</p>
              <ul className="pl-4 list-disc text-crm-text text-[12px]">
                {selectedAddons.map(a => <li key={a.id}>{a.name}</li>)}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={onAddToCalendar} className="border border-crm-border shadow-sm text-crm-text px-5 py-2 rounded-lg hover:bg-crm-surface transition-colors text-[13px] font-semibold flex items-center justify-center gap-2">
            📅 Add to Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
