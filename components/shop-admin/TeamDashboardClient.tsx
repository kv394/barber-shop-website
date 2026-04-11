'use client';

import { useState } from 'react';
import Link from 'next/link';
import StaffAvailability from '@/components/shop-admin/StaffAvailability';
import StaffProfileModalWrapper from '@/components/shop-admin/StaffProfileModalWrapper';

export default function TeamDashboardClient({ 
  shopId, 
  initialDate, 
  initialStaff,
  addLeaveAction,
  removeLeaveAction,
  updateDayHoursAction
}: any) {
  // Use state to track the input values for each staff member
  const [formStates, setFormStates] = useState<Record<string, { open: string, close: string }>>({});

  const handleTimeChange = (staffId: string, type: 'open' | 'close', value: string) => {
      setFormStates(prev => ({
          ...prev,
          [staffId]: {
              ...prev[staffId],
              [type]: value
          }
      }));
  };

  // Helper to get the current value, falling back to props if not edited
  const getTimeValue = (staffId: string, type: 'open' | 'close', defaultValue: string) => {
      return formStates[staffId]?.[type] ?? defaultValue;
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Link href={`/shop/${shopId}/portfolio`} className="bg-white text-slate-900 border-2 border-b-[6px] border-botanical-border px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
          📸 Shop Portfolio Gallery
        </Link>
      </div>

      <StaffAvailability defaultDate={initialDate} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialStaff.map((staffMember: any) => {
          const isOnLeave = staffMember.isOnLeave;
          const isNotWorking = staffMember.using === 'not-working' || staffMember.using === 'not-set';
          
          const defaultOpen = staffMember.openTime || "09:00";
          const defaultClose = staffMember.closeTime || "17:00";

          return (
            <div key={staffMember.id} className={`bg-white border-2 border-b-[6px] border-botanical-border rounded-2xl p-5 flex flex-col shadow-lg transition-all duration-200 hover:shadow-xl hover:border-gray-200 ${isOnLeave ? 'ring-1 ring-red-500/50' : ''}`}>
              
              <div className="flex justify-between items-start mb-4">
                <StaffProfileModalWrapper staff={staffMember}>
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-b-[6px] border-botanical-border flex items-center justify-center shrink-0">
                      {staffMember.imageUrl ? (
                        <img src={staffMember.imageUrl} alt={staffMember.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm">👤</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-0.5 flex items-center gap-2">
                        {staffMember.name || staffMember.email.split('@')[0]}
                        {staffMember.role === 'SHOP_ADMIN' && <span className="text-[9px] bg-botanical-primary/20 text-botanical-primary px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Admin</span>}
                      </h2>
                      <p className="text-xs text-slate-600">{staffMember.email}</p>
                    </div>
                  </div>
                </StaffProfileModalWrapper>
                
                {/* Actions & Status Badge */}
                <div className="flex flex-col items-end gap-2">
                  {isOnLeave ? (
                    <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">On Leave</span>
                  ) : isNotWorking ? (
                    <span className="text-[10px] bg-white text-slate-900 border-2 border-b-[6px] border-botanical-border px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Day Off</span>
                  ) : staffMember.isClockedIn ? (
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Clocked In
                    </span>
                  ) : (
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Scheduled</span>
                  )}
                </div>
              </div>

              {/* Schedule / Leave Display */}
              <div className="flex-grow bg-white rounded-xl p-3 mb-4 min-h-[120px] flex flex-col">
                {isOnLeave ? (
                  <div className="flex-grow flex flex-col justify-center items-center text-center">
                    <span className="text-3xl mb-2">🏖️</span>
                    <p className="text-sm font-semibold text-red-700">Currently on Leave</p>
                    {staffMember.leaves[0]?.reason && <p className="text-xs text-red-600 mt-1 italic">"{staffMember.leaves[0].reason}"</p>}
                    
                    <form action={removeLeaveAction} className="mt-4">
                        <input type="hidden" name="staffId" value={staffMember.id} />
                        <input type="hidden" name="shopId" value={shopId} />
                        <input type="hidden" name="date" value={initialDate} />
                        <input type="hidden" name="startTime" value="00:00" />
                        <input type="hidden" name="endTime" value="23:59" />
                        <button type="submit" className="text-xs text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 hover:text-red-800 px-3 py-1.5 rounded transition-colors">Cancel Leave</button>
                    </form>
                  </div>
                ) : isNotWorking ? (
                  <div className="flex-grow flex flex-col justify-center items-center text-center">
                    <span className="text-3xl mb-2">💤</span>
                    <p className="text-sm font-medium text-slate-600 mb-4">Scheduled Day Off</p>
                    
                    {/* Quick Add Shift form with editable times */}
                    <form action={updateDayHoursAction} className="w-full space-y-2 border-t border-gray-200 pt-3">
                        <input type="hidden" name="staffId" value={staffMember.id} />
                        <input type="hidden" name="shopId" value={shopId} />
                        <input type="hidden" name="dayOfWeek" value={staffMember.dayOfWeek} />
                        <input type="hidden" name="isWorking" value="true" />
                        <input type="hidden" name="date" value={initialDate} />
                        
                        <div className="flex justify-center gap-2 items-center">
                            <input 
                                type="time" 
                                name="openTime" 
                                value={getTimeValue(staffMember.id, 'open', defaultOpen)}
                                onChange={(e) => handleTimeChange(staffMember.id, 'open', e.target.value)}
                                className="bg-white text-slate-900 text-xs p-1 rounded border-2 border-b-[6px] border-botanical-border outline-none focus:ring-1 focus:ring-botanical-primary"
                            />
                            <span className="text-slate-600 text-xs">to</span>
                            <input 
                                type="time" 
                                name="closeTime" 
                                value={getTimeValue(staffMember.id, 'close', defaultClose)}
                                onChange={(e) => handleTimeChange(staffMember.id, 'close', e.target.value)}
                                className="bg-white text-slate-900 text-xs p-1 rounded border-2 border-b-[6px] border-botanical-border outline-none focus:ring-1 focus:ring-botanical-primary"
                            />
                        </div>
                        <button type="submit" className="w-full text-xs text-botanical-primary bg-botanical-primary/10 hover:bg-botanical-primary hover:text-white py-1.5 rounded transition-colors border border-botanical-primary/20 font-bold">Add Shift</button>
                    </form>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Today's Hours</span>
                        <span className="text-sm font-mono text-botanical-primary">
                            {new Date(`1970-01-01T${staffMember.openTime}Z`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} - {new Date(`1970-01-01T${staffMember.closeTime}Z`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                        </span>
                    </div>
                    
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-botanical-border scrollbar-track-transparent">
                      {staffMember.schedule.length === 0 ? (
                          <p className="text-xs text-slate-600 text-center py-4">No working slots configured.</p>
                      ) : (
                          staffMember.schedule.map((slot: any) => (
                            <div key={slot.time} className={`px-2.5 py-1.5 rounded text-xs flex justify-between items-center ${slot.isBooked ? 'bg-amber-50 border border-amber-200' : staffMember.isClockedIn ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-transparent'}`}>
                              <span className="font-mono text-slate-600">{slot.time}</span>
                              {slot.isBooked ? (
                                <span className="font-bold text-amber-700">Booked</span>
                              ) : (
                                <span className={staffMember.isClockedIn ? "text-emerald-700" : "text-green-700"}>
                                    {staffMember.isClockedIn ? 'Clocked In' : 'Open'}
                                </span>
                              )}
                            </div>
                          ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-auto">
                <Link 
                    href={`/shop/${shopId}/settings/team/${staffMember.id}/schedule`} 
                    className="w-full text-center bg-white hover:bg-gray-50 text-slate-900 text-xs font-semibold py-2 rounded-lg transition-colors border-2 border-b-[6px] border-botanical-border"
                >
                    Edit Schedule
                </Link>

                {!isOnLeave && (
                    <form action={addLeaveAction} className="flex flex-col gap-1">
                        <input type="hidden" name="staffId" value={staffMember.id} />
                        <input type="hidden" name="shopId" value={shopId} />
                        <input type="hidden" name="date" value={initialDate} />
                        
                        <div className="flex justify-center gap-1">
                             <input 
                                type="time" 
                                name="startTime" 
                                value={getTimeValue(staffMember.id, 'open', defaultOpen)}
                                onChange={(e) => handleTimeChange(staffMember.id, 'open', e.target.value)}
                                className="w-full bg-white text-slate-600 text-[10px] p-1 rounded border-2 border-b-[6px] border-botanical-border outline-none focus:ring-1 focus:ring-botanical-primary"
                            />
                             <input 
                                type="time" 
                                name="endTime" 
                                value={getTimeValue(staffMember.id, 'close', defaultClose)}
                                onChange={(e) => handleTimeChange(staffMember.id, 'close', e.target.value)}
                                className="w-full bg-white text-slate-600 text-[10px] p-1 rounded border-2 border-b-[6px] border-botanical-border outline-none focus:ring-1 focus:ring-botanical-primary"
                            />
                        </div>

                        <button type="submit" className="w-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold py-1.5 rounded transition-colors border border-red-200">
                            Mark On Leave
                        </button>
                    </form>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </>
  );
}
