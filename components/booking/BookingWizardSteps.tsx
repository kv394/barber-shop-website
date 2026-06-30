import Image from 'next/image';
import React from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { fmtPrice } from '@/lib/formatters';
import StyleDiscovery from '@/components/booking/StyleDiscovery';
import { Turnstile } from '@marsidev/react-turnstile';

export function ServiceStep({
  services,
  serviceSearchQuery,
  setServiceSearchQuery,
  selectedService,
  setSelectedService,
  handleNext,
  tStyles,
  themeColor,
  activeBg,
  currency,
  shopId
}: any) {
  return (
    <div className="space-y-3">
      <div className="mb-2">
        <input
          type="search"
          placeholder="Search services..."
          className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
          value={serviceSearchQuery}
          onChange={(e) => setServiceSearchQuery(e.target.value)}
        />
      </div>
      {services.filter((s: any) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).map((s: any) => (
        <button 
          key={s.id} 
          onClick={() => { setSelectedService(s); handleNext(); }}
          className={`w-full text-left p-4 cursor-pointer transition-all ${selectedService?.id === s.id ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedService?.id === s.id ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}
        >
          <div className="flex justify-between items-center">
            <span className="font-medium text-crm-text">{s.name}</span>
            <span className="font-semibold text-crm-text">{fmtPrice(s.price, currency)}</span>
          </div>
          <div className="text-sm text-crm-muted mt-1">{s.duration} mins</div>
        </button>
      ))}
      {services.length === 0 && <p className="text-crm-muted text-center py-4">No services available.</p>}
      {services.length > 0 && services.filter((s: any) => s.name.toLowerCase().includes(serviceSearchQuery.toLowerCase())).length === 0 && (
        <p className="text-crm-muted text-center py-4">No services match your search.</p>
      )}
      {/* Style Discovery AI */}
      <div className="mt-4 pt-4 border-t border-crm-border">
        <StyleDiscovery shopId={shopId} themeColor={themeColor} />
      </div>
    </div>
  );
}

export function StaffStep({
  staff,
  selectedStaff,
  setSelectedStaff,
  handleNext,
  tStyles,
  themeColor,
  activeBg
}: any) {
  return (
    <div className="space-y-3">
      <button 
        onClick={() => { setSelectedStaff(null); handleNext(); }}
        className={`w-full text-left p-4 cursor-pointer transition-all ${selectedStaff === null ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff === null ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}
      >
        <div className="font-medium text-crm-text">No Preference</div>
        <div className="text-sm text-crm-muted">First available professional</div>
      </button>
      {staff.map((st: any) => (
        <button 
          key={st.id} 
          onClick={() => { setSelectedStaff(st); handleNext(); }}
          className={`w-full text-left p-4 cursor-pointer transition-all ${selectedStaff?.id === st.id ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedStaff?.id === st.id ? { borderColor: themeColor || '#111827', backgroundColor: activeBg } : {}}
        >
          <div className="font-medium text-crm-text">{st.name}</div>
        </button>
      ))}
    </div>
  );
}

export function DateTimeStep({
  selectedDate,
  setSelectedDate,
  tempPickerDate,
  setTempPickerDate,
  setTempDate,
  setSelectedTime,
  availableTimeSlots,
  sortByFit,
  setSortByFit,
  loadingSlots,
  selectedTime,
  tStyles,
  themeColor,
  secondaryColor,
  templateType,
  formatTime
}: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-crm-muted mb-2">Select Date</label>
        {!selectedDate ? (
          <div className="flex justify-center bg-crm-bg p-4 rounded-xl border border-crm-border">
            <DayPicker
              mode="single"
              selected={tempPickerDate}
              onSelect={(date) => {
                setTempPickerDate(date);
                if (date) {
                  setTempDate(format(date, 'yyyy-MM-dd'));
                  setSelectedTime('');
                }
              }}
              disabled={{ before: new Date(new Date().setHours(0,0,0,0)) }}
              footer={
                tempPickerDate ? (
                  <div className="mt-4 pt-4 border-t border-crm-border">
                    <button
                      onClick={() => {
                        if (tempPickerDate) {
                          setSelectedDate(format(tempPickerDate, 'yyyy-MM-dd'));
                        }
                      }}
                      className={tStyles.btnPrimary} style={{ backgroundColor: themeColor || '#111827', color: secondaryColor || undefined }}
                    >
                      OK
                    </button>
                  </div>
                ) : null
              }
            />
          </div>
        ) : (
          <button 
            className="w-full flex justify-between items-center p-4 border rounded-xl bg-crm-bg border-crm-border cursor-pointer hover:border-gray-800 transition-colors"
            onClick={() => setSelectedDate('')}
          >
            <span className="font-medium text-crm-text">
              {format(new Date(selectedDate + 'T00:00:00'), 'MMMM d, yyyy')}
            </span>
            <span className="text-sm text-crm-muted">Change</span>
          </button>
        )}
      </div>
      {selectedDate && (
        <div className="pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-crm-muted">Select Time</label>
            {availableTimeSlots.some((s: any) => s.isRecommended) && (
              <button
                type="button"
                onClick={() => setSortByFit((v: boolean) => !v)}
                className="text-xs text-crm-muted hover:text-crm-text transition-colors flex items-center gap-1"
              >
                {sortByFit ? '🕐 Sort by time' : '⭐ Sort by best fit'}
              </button>
            )}
          </div>
          {loadingSlots ? (
            <div className="py-8 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div></div>
          ) : availableTimeSlots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {availableTimeSlots.map((slot: any) => (
                <button
                  key={slot.time}
                  onClick={() => setSelectedTime(slot.time)}
                  className={`p-4 text-base sm:p-3 sm:text-sm transition-all font-medium relative focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-900 ${selectedTime === slot.time ? tStyles.cardActive : tStyles.cardInactive}`} style={selectedTime === slot.time ? { borderColor: themeColor || '#111827', backgroundColor: themeColor || '#111827', color: templateType === 'editorial' ? '#121412' : '#ffffff' } : {}}
                >
                  {formatTime(slot.time)}
                  {slot.isRecommended && selectedTime !== slot.time && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-400 text-[9px] font-bold text-amber-900 px-1.5 py-0.5 rounded-full leading-none shadow-sm">⭐</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-crm-muted text-center py-4 bg-crm-bg rounded-xl">No available times on this date.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function DetailsStep({
  error,
  selectedService,
  currency,
  selectedStaff,
  selectedDate,
  selectedTime,
  name,
  setName,
  email,
  setEmail,
  phone,
  setPhone,
  shopType,
  isHouseCall,
  setIsHouseCall,
  serviceLocation,
  setServiceLocation,
  notes,
  setNotes,
  metadata,
  setMetadata,
  tStyles,
  themeColor,
  formatTime,
  turnstileToken,
  setTurnstileToken,
  templateType
}: any) {
  return (
    <div className="space-y-4">
      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">{error}</div>}
      
      <div className="p-4 bg-crm-bg rounded-xl border border-crm-border">
        <h3 className="font-medium text-crm-text mb-3">Booking Summary</h3>
        <div className="text-sm text-crm-muted space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-crm-border">
            <span>{selectedService?.name}</span>
            <span className="font-medium text-crm-text">{fmtPrice(selectedService?.price || 0, currency)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-crm-border">
            <span>Professional</span>
            <span className="font-medium text-crm-text">{selectedStaff ? selectedStaff.name : 'No Preference'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Time</span>
            <span className="font-medium text-crm-text">
              {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedTime ? formatTime(selectedTime) : ''}
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-crm-muted mb-1">Name</label>
        <input 
          type="text" 
          placeholder="John Doe"
          autoComplete="name"
          className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-crm-muted mb-1">Email</label>
        <input 
          type="email" 
          placeholder="john@example.com"
          autoComplete="email"
          className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-crm-muted mb-1">Phone (Optional)</label>
        <input 
          type="tel" 
          placeholder="(555) 000-0000"
          autoComplete="tel"
          className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      </div>

      {shopType === 'HYBRID' && (
        <div className="mb-4 bg-crm-bg p-3 rounded-xl border border-crm-border flex items-center justify-between">
          <div>
            <div className="font-medium text-crm-text text-sm">Service Location</div>
            <div className="text-xs text-crm-muted">{isHouseCall ? 'House Call' : 'In-Shop'}</div>
          </div>
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button type="button" onClick={() => setIsHouseCall(false)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${!isHouseCall ? 'bg-crm-surface shadow-sm text-crm-text' : 'text-crm-muted'}`}>In-Shop</button>
            <button type="button" onClick={() => setIsHouseCall(true)} className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${isHouseCall ? 'bg-crm-surface shadow-sm text-crm-text' : 'text-crm-muted'}`}>House Call</button>
          </div>
        </div>
      )}
      
      {isHouseCall && (
        <div>
          <label className="block text-sm font-medium text-crm-muted mb-1">Service Address</label>
          <input 
            type="text" 
            placeholder="123 Main St, City, Zip"
            className={tStyles.input} style={{ '--tw-ring-color': themeColor } as any}
            value={serviceLocation}
            onChange={e => setServiceLocation(e.target.value)}
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-crm-muted mb-1">Notes (Optional)</label>
        <textarea 
          placeholder="Any special requests?"
          className="w-full border p-3 rounded-xl bg-crm-bg focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all min-h-[80px]"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-crm-muted mb-1">Additional Details (JSON) (Optional)</label>
        <textarea
          placeholder='{"petName":"Fluffy","vehicleModel":"Toyota"}'
          className="w-full border p-3 rounded-xl bg-crm-bg focus:outline-none focus:ring-2 focus:ring-gray-900 border-transparent transition-all min-h-[80px]"
          value={metadata}
          onChange={e => setMetadata(e.target.value)}
        />
      </div>

      <div className="flex justify-center mt-6">
        <Turnstile 
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''} 
          onSuccess={(token: string) => setTurnstileToken(token)}
          options={{ theme: templateType === 'editorial' ? 'light' : 'dark' }}
        />
      </div>
    </div>
  );
}
