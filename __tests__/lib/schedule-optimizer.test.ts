import { scoreAndSortSlots, RawSlot, BusyBlock } from '@/lib/schedule-optimizer';
import { describe, it, expect } from 'vitest';

describe('scoreAndSortSlots', () => {
  it('should return empty array if no slots provided', () => {
    expect(scoreAndSortSlots([], [], '2023-10-10', 30)).toEqual([]);
  });

  it('should score slots based on gap fill logic', () => {
    const slots: RawSlot[] = [
      { time: '09:00', staffId: 'staff1' },
      { time: '10:00', staffId: 'staff1' },
      { time: '11:00', staffId: 'staff1' },
    ];
    
    const busyBlocks: BusyBlock[] = [
      { startTime: new Date('2023-10-10T08:00:00Z'), endTime: new Date('2023-10-10T09:00:00Z'), staffId: 'staff1' }, // ends flush with 09:00
      { startTime: new Date('2023-10-10T11:30:00Z'), endTime: new Date('2023-10-10T12:00:00Z'), staffId: 'staff1' }, // starts flush with 11:00 (if 30m duration)
    ];

    // with 30 min duration
    // 09:00 slot -> gapBefore = 0, gapAfter = 11:30 - 09:30 = 2 hours. flushBefore=true
    // 10:00 slot -> gapBefore = 10:00 - 09:00 = 1 hour, gapAfter = 11:30 - 10:30 = 1 hour. no flush
    // 11:00 slot -> gapBefore = 11:00 - 09:00 = 2 hours, gapAfter = 11:30 - 11:30 = 0. flushAfter=true
    
    const result = scoreAndSortSlots(slots, busyBlocks, '2023-10-10', 30);
    
    // We expect the 09:00 and 11:00 slots to have higher scores than 10:00
    // 09:00 -> flushBefore + tiebreaker
    // 11:00 -> flushAfter + tiebreaker
    expect(result.length).toBe(3);
    
    // The ones with flush are marked recommended and have higher scores
    expect(result.find(r => r.time === '09:00')?.score).toBeGreaterThan(50);
    expect(result.find(r => r.time === '11:00')?.score).toBeGreaterThan(50);
    expect(result.find(r => r.time === '10:00')?.score).toBeLessThan(50);
  });

  it('should grant perfect gap fill bonus', () => {
    const slots: RawSlot[] = [
      { time: '09:00', staffId: 'staff1' },
    ];
    
    const busyBlocks: BusyBlock[] = [
      { startTime: new Date('2023-10-10T08:30:00Z'), endTime: new Date('2023-10-10T09:00:00Z'), staffId: 'staff1' },
      { startTime: new Date('2023-10-10T09:30:00Z'), endTime: new Date('2023-10-10T10:00:00Z'), staffId: 'staff1' },
    ];

    const result = scoreAndSortSlots(slots, busyBlocks, '2023-10-10', 30);
    
    // 50 (before) + 50 (after) + 30 (perfect) + 20 (tiebreaker 0 gap) = 150
    expect(result[0].score).toBe(150);
    expect(result[0].isRecommended).toBe(true);
  });
  
  it('should parse string dates in busyBlocks', () => {
    const slots: RawSlot[] = [
      { time: '09:00', staffId: 'staff1' },
    ];
    
    const busyBlocks: BusyBlock[] = [
      { startTime: '2023-10-10T08:30:00Z', endTime: '2023-10-10T09:00:00Z', staffId: 'staff1' },
    ];

    const result = scoreAndSortSlots(slots, busyBlocks, '2023-10-10', 30);
    expect(result[0].score).toBeGreaterThan(50);
  });
});
