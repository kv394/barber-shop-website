'use client';

import { useState } from 'react';
import Link from 'next/link';
import StaffAvailability from './StaffAvailability';

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
      <StaffAvailability defaultDate={initialDate} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialStaff.map((staffMember: any) => {
          const isOnLeave = staffMember.isOnLeave;
          const isNotWorking = staffMember.using === 'not-working' || staffMember.using === 'not-set';
          
          const defaultOpen = staffMember.openTime || "09:00";
          const defaultClose = staffMember.closeTime || "17:00";

          return (
            <div key={staffMember.id} className={`bg-slate-900/70 border border-white/10 rounded-2xl p-5 flex flex-col shadow-lg transition-all duration-200 hover:shadow-xl hover:border-white/20 ${isOnLeave ? 'ring-1 ring-red-500/50' : ''}`}>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    {staffMember.name || staffMember.email.split('@')[0]}
                    {staffMember.role === 'SHOP_ADMIN' && <span className="text-[9px] bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Admin</span>}
                  </h2>
                  <p className="text-xs text-gray-500">{staffMember.email}</p>
                </div>
                
                {/* Status Badge */}
                {isOnLeave ? (
                  <span className="text-[10px] bg-red-900/50 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">On Leave</span>
                ) : isNotWorking ? (
                  <span className="text-[10px] bg-slate-800 text-gray-400 border border-slate-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Day Off</span>
                ) : (
                  <span className="text-[10px] bg-green-900/50 text-green-300 border border-green-500/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Working</span>
                )}
              </div>

              {/* Schedule / Leave Display */}
              <div className="flex-grow bg-slate-800/40 rounded-xl p-3 mb-4 min-h-[120px] flex flex-col">
                {isOnLeave ? (
                  <div className="flex-grow flex flex-col justify-center items-center text-center">
                    <span className="text-3xl mb-2">🏖️</span>
                    <p className="text-sm font-semibold text-red-300">Currently on Leave</p>
                    {staffMember.leaves[0]?.reason && <p className="text-xs text-red-400 mt-1 italic">"{staffMember.leaves[0].reason}"</p>}
                    
                    <form action={removeLeaveAction} className="mt-4">
                        <input type="hidden" name="staffId" value={staffMember.id} />
                        <input type="hidden" name="shopId" value={shopId} />
                        <input type="hidden" name="date" value={initialDate} />
                        <input type="hidden" name="startTime" value="00:00" />
                        <input type="hidden" name="endTime" value="23:59" />
                        <button type="submit" className="text-xs text-white bg-slate-700 hover:bg-red-600 px-3 py-1.5 rounded transition-colors">Cancel Leave</button>
                    </form>
                  </div>
                ) : isNotWorking ? (
                  <div className="flex-grow flex flex-col justify-center items-center text-center">
                    <span className="text-3xl mb-2">💤</span>
                    <p className="text-sm font-medium text-gray-400 mb-4">Scheduled Day Off</p>
                    
                    {/* Quick Add Shift form with editable times */}
                    <form action={updateDayHoursAction} className="w-full space-y-2 border-t border-white/5 pt-3">
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
                                className="bg-slate-700 text-white text-xs p-1 rounded border border-slate-600 outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                            <span className="text-gray-500 text-xs">to</span>
                            <input 
                                type="time" 
                                name="closeTime" 
                                value={getTimeValue(staffMember.id, 'close', defaultClose)}
                                onChange={(e) => handleTimeChange(staffMember.id, 'close', e.target.value)}
                                className="bg-slate-700 text-white text-xs p-1 rounded border border-slate-600 outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                        </div>
                        <button type="submit" className="w-full text-xs text-brand-gold bg-brand-gold/10 hover:bg-brand-gold/20 py-1.5 rounded transition-colors border border-brand-gold/20">Add Shift</button>
                    </form>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today's Hours</span>
                        <span className="text-sm font-mono text-brand-gold">
                            {new Date(`1970-01-01T${staffMember.openTime}Z`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})} - {new Date(`1970-01-01T${staffMember.closeTime}Z`).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                        </span>
                    </div>
                    
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
                      {staffMember.schedule.length === 0 ? (
                          <p className="text-xs text-gray-500 text-center py-4">No working slots configured.</p>
                      ) : (
                          staffMember.schedule.map((slot: any) => (
                            <div key={slot.time} className={`px-2.5 py-1.5 rounded text-xs flex justify-between items-center ${slot.isBooked ? 'bg-amber-900/40 border border-amber-500/20' : 'bg-slate-800 border border-transparent'}`}>
                              <span className="font-mono text-gray-300">{slot.time}</span>
                              {slot.isBooked ? (
                                <span className="font-bold text-amber-400">Booked</span>
                              ) : (
                                <span className="text-green-400">Open</span>
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
                    className="w-full text-center bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors border border-slate-700"
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
                                className="w-full bg-slate-800 text-gray-300 text-[10px] p-1 rounded border border-slate-700 outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                             <input 
                                type="time" 
                                name="endTime" 
                                value={getTimeValue(staffMember.id, 'close', defaultClose)}
                                onChange={(e) => handleTimeChange(staffMember.id, 'close', e.target.value)}
                                className="w-full bg-slate-800 text-gray-300 text-[10px] p-1 rounded border border-slate-700 outline-none focus:ring-1 focus:ring-brand-gold"
                            />
                        </div>

                        <button type="submit" className="w-full bg-red-900/40 hover:bg-red-600 text-red-300 hover:text-white text-xs font-semibold py-1.5 rounded transition-colors border border-red-500/30">
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
