export interface BookingReviewScreenProps {
  themeColor?: string;
  error: string | null;
  serviceName: string;
  formattedDate: string;
  selectedTime: string;
  confirmedStaffName: string;
  totalDuration: number;
  totalPrice: number;
  selectedAddons: { id: string; name: string; price: number; durationMin: number }[];
  isWalkIn: boolean;
  clientName: string;
  selectedExistingClient: { id: string; name: string | null; email: string; phone: string | null } | null;
  bookingNotes: string;
  isBooking: boolean;
  onClose: () => void;
  onEdit: () => void;
  onBook: () => void;
}

export function BookingReviewScreen({
  themeColor,
  error,
  serviceName,
  formattedDate,
  selectedTime,
  confirmedStaffName,
  totalDuration,
  totalPrice,
  selectedAddons,
  isWalkIn,
  clientName,
  selectedExistingClient,
  bookingNotes,
  isBooking,
  onClose,
  onEdit,
  onBook
}: BookingReviewScreenProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-crm-surface rounded-xl p-6 w-full max-w-md border border-crm-border shadow-2xl relative text-left">
        <button onClick={onEdit} className="absolute top-4 left-4 text-crm-muted hover:text-crm-text bg-crm-surface rounded-full w-8 h-8 flex items-center justify-center z-10">←</button>
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-4 bg-crm-surface hover:bg-gray-100 shadow-sm z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors font-bold text-[13px]" style={{ color: themeColor || "#111827" }}>✕</button>
        <h3 className="font-bold text-crm-primary mb-1 text-lg text-center mt-2">Review Your Booking</h3>
        <p className="text-crm-muted mb-5 text-[13px] text-center">Please confirm the details below.</p>

        {error && <p className="text-status-cancelled bg-status-cancelled/20 p-3 rounded mb-4 text-[13px]">{error}</p>}

        <div className="bg-crm-surface rounded-lg border border-crm-border shadow-sm divide-y divide-white/10 mb-6">
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
            <span className="text-crm-muted text-[13px]">Service</span>
            <span className="text-crm-text font-semibold">{serviceName}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
            <span className="text-crm-muted text-[13px]">Date</span>
            <span className="text-crm-text">{formattedDate}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
            <span className="text-crm-muted text-[13px]">Time</span>
            <span className="text-crm-text">{selectedTime}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
            <span className="text-crm-muted text-[13px]">Staff</span>
            <span className="text-crm-text">{confirmedStaffName}</span>
          </div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
            <span className="text-crm-muted text-[13px]">Duration</span>
            <span className="text-crm-text">{totalDuration} mins</span>
          </div>
          <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
            <span className="text-crm-muted text-[13px]">Price</span>
            <span className="text-crm-accent font-bold text-lg">${totalPrice.toFixed(2)}</span>
          </div>
          {selectedAddons.length > 0 && (
            <div className="p-4 bg-crm-bg border-y border-crm-border">
              <span className="text-crm-muted text-[13px] block mb-2">Selected Add-Ons</span>
              <ul className="space-y-1">
                {selectedAddons.map(a => (
                  <li key={a.id} className="text-crm-text text-[13px] flex justify-between">
                    <span>+ {a.name}</span>
                    <span>${a.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isWalkIn && (clientName || selectedExistingClient) && (
            <div className="flex flex-wrap justify-between gap-x-2 gap-y-2 items-center p-4">
              <span className="text-crm-muted text-[13px]">Client</span>
              <span className="text-crm-text">{selectedExistingClient?.name || clientName}</span>
            </div>
          )}
          {bookingNotes && (
            <div className="p-4">
              <span className="text-crm-muted text-[13px] block mb-1">Notes</span>
              <span className="text-crm-text text-[13px]">{bookingNotes}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onEdit} className="flex-1 border border-crm-border shadow-sm text-crm-text font-semibold py-3 rounded-lg hover:bg-crm-surface transition-colors">
            Edit
          </button>
          <button onClick={onBook} disabled={isBooking} className="flex-1 bg-crm-primary text-white font-bold py-3 rounded-lg hover:bg-crm-surface hover:text-crm-primary border border-transparent hover:border-crm-primary/30 transition-colors disabled:opacity-50">
            {isBooking ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-brand-dark border-t-transparent rounded-full animate-spin"></span>
                Booking...
              </span>
            ) : 'Confirm & Book'}
          </button>
        </div>
      </div>
    </div>
  );
}
