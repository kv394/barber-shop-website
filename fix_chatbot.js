const fs = require('fs');

let content = fs.readFileSync('app/api/chat/booking/route.ts', 'utf8');

// 1. Replace the "Dummy logic" for check_availability with real logic
const dummyLogicStart = content.indexOf('// Dummy logic for availability');
const dummyLogicEnd = content.indexOf('lastUiType = \'time_picker\';') + 'lastUiType = \'time_picker\';'.length;

const realLogic = `
                        const shopTz = shop.timezone || 'America/New_York';
                        const { startOfDay, endOfDay } = toShopTzDayBounds(date, shopTz);
                        
                        const appointments = await prisma.appointment.findMany({
                            where: { shopId: realShopId, startTime: { gte: startOfDay, lt: endOfDay }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
                            select: { startTime: true, endTime: true, staffId: true }
                        });
                        
                        let targetStaff = await prisma.user.findMany({
                            where: { shopId: realShopId, role: 'STAFF', ...(staffId ? { id: staffId } : {}) }
                        });
                        if (targetStaff.length === 0) {
                            targetStaff = await prisma.user.findMany({ where: { shopId: realShopId, role: 'STAFF' } });
                        }
                        
                        const googleBusySlotsPromises = targetStaff.map(async (st) => {
                            const busySlots = await getCalendarBusySlots(st.id, startOfDay, endOfDay);
                            return busySlots.map(slot => ({ startTime: slot.startTime, endTime: slot.endTime, staffId: st.id }));
                        });
                        const googleBusySlotsNested = await Promise.all(googleBusySlotsPromises);
                        const allBusySlots = [...appointments, ...googleBusySlotsNested.flat()];
                        
                        const generatedSlots = [];
                        for (let hour = 9; hour <= 17; hour++) {
                            for (const min of [0, 30]) {
                                if (hour === 17 && min === 30) continue;
                                
                                const timeStr = \`\${hour.toString().padStart(2, '0')}:\${min.toString().padStart(2, '0')}\`;
                                const slotStartTime = new Date(startOfDay.getTime() + (hour * 60 + min) * 60000);
                                const slotEndTime = new Date(slotStartTime.getTime() + service.duration * 60000);
                                
                                let isAvailable = false;
                                let availableStaffId = null;
                                
                                for (const st of targetStaff) {
                                    const staffBusy = allBusySlots.filter(s => s.staffId === st.id);
                                    const hasOverlap = staffBusy.some(bs => slotStartTime < bs.endTime && slotEndTime > bs.startTime);
                                    if (!hasOverlap) {
                                        isAvailable = true;
                                        availableStaffId = st.id;
                                        break;
                                    }
                                }
                                
                                if (isAvailable) {
                                    generatedSlots.push({ time: timeStr, staffId: staffId || availableStaffId, available: true });
                                }
                            }
                        }
                        
                        if (generatedSlots.length === 0) {
                            result = { message: "No available slots on this date. Please try another date." };
                        } else {
                            result = {
                                availableSlots: generatedSlots.map(s => ({ time: s.time, staffId: s.staffId })),
                                message: "Returning available slots to the user interface."
                            };
                            lastAvailabilitySlots = generatedSlots;
                            lastUiType = 'time_picker';
                        }
`;

content = content.substring(0, dummyLogicStart) + realLogic + content.substring(dummyLogicEnd + 1);

// 2. Fix timezone in book_appointment
content = content.replace(
  'const startTime = new Date(`${date}T${time}:00Z`); // Note: Timezone needs proper handling',
  `const shopTz = shop.timezone || 'America/New_York';
                    const { startOfDay } = toShopTzDayBounds(date, shopTz);
                    const [h, m] = time.split(':');
                    const startTime = new Date(startOfDay.getTime() + (parseInt(h) * 60 + parseInt(m)) * 60000);`
);

// 3. Fix reschedule_appointment timezone
content = content.replace(
  'const startTime = new Date(`${date}T${time}:00Z`); // Timezone needs proper handling',
  `const shopTz = shop.timezone || 'America/New_York';
                            const { startOfDay } = toShopTzDayBounds(date, shopTz);
                            const [h, m] = time.split(':');
                            const startTime = new Date(startOfDay.getTime() + (parseInt(h) * 60 + parseInt(m)) * 60000);`
);

fs.writeFileSync('app/api/chat/booking/route.ts', content);
