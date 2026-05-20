/**
 * Schedule Optimizer — Smart Gap-Fill Scoring
 *
 * Scores available time slots based on how well they "fill" gaps in the
 * existing schedule. Slots that abut existing appointments score higher,
 * nudging clients toward choices that pack the schedule efficiently.
 *
 * Used by both the client-side BookingWizard and the server-side chat booking API.
 */

export interface RawSlot {
  time: string;       // "HH:MM" format
  staffId: string;
}

export interface BusyBlock {
  startTime: Date | string;
  endTime: Date | string;
  staffId: string;
}

export interface ScoredSlot extends RawSlot {
  score: number;
  isRecommended: boolean;
}

/**
 * Convert "HH:MM" time string + date string into epoch ms.
 * Uses a simple UTC-based calculation (matches how BookingWizard constructs dates).
 */
function timeToMs(dateStr: string, timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  const base = new Date(`${dateStr}T00:00:00Z`);
  base.setUTCHours(h, m, 0, 0);
  return base.getTime();
}

/**
 * Score and sort a list of available time slots by gap-fill efficiency.
 *
 * Algorithm:
 *   For each slot, find the nearest busy block before and after it (for the same staff).
 *   - gapBefore = slot.start - prevBlock.end   (Infinity if no previous)
 *   - gapAfter  = nextBlock.start - slot.end   (Infinity if no next)
 *   - score = bonuses for tight adjacency on each side
 *
 * Higher score = better gap fill = shown first.
 *
 * @param slots       Raw available slots (time + staffId)
 * @param busyBlocks  All busy blocks for the day (existing appointments + google cal)
 * @param dateStr     The date string "YYYY-MM-DD"
 * @param serviceDurationMin  Duration of the service being booked (minutes)
 * @param maxRecommended  How many slots to mark as "recommended" (default 3)
 * @returns Slots sorted by score (best first), each with score + isRecommended
 */
export function scoreAndSortSlots(
  slots: RawSlot[],
  busyBlocks: BusyBlock[],
  dateStr: string,
  serviceDurationMin: number,
  maxRecommended: number = 3
): ScoredSlot[] {
  if (slots.length === 0) return [];

  // Normalize busy blocks to epoch ms, grouped by staffId
  const busyByStaff = new Map<string, { start: number; end: number }[]>();

  for (const block of busyBlocks) {
    const start = typeof block.startTime === 'string' ? new Date(block.startTime).getTime() : block.startTime.getTime();
    const end = typeof block.endTime === 'string' ? new Date(block.endTime).getTime() : block.endTime.getTime();
    const staffId = block.staffId;

    if (!busyByStaff.has(staffId)) {
      busyByStaff.set(staffId, []);
    }
    busyByStaff.get(staffId)!.push({ start, end });
  }

  // Sort each staff's busy blocks by start time
  const staffIds = Array.from(busyByStaff.keys());
  for (const staffId of staffIds) {
    const blocks = busyByStaff.get(staffId)!;
    blocks.sort((a: { start: number; end: number }, b: { start: number; end: number }) => a.start - b.start);
  }

  const durationMs = serviceDurationMin * 60_000;
  const FLUSH_THRESHOLD_MS = 5 * 60_000; // 5 minutes — treat as "flush" adjacency

  const scored: ScoredSlot[] = slots.map(slot => {
    const slotStart = timeToMs(dateStr, slot.time);
    const slotEnd = slotStart + durationMs;
    const staffBlocks = busyByStaff.get(slot.staffId) || [];

    let gapBefore = Infinity;
    let gapAfter = Infinity;

    for (const block of staffBlocks) {
      // Blocks that end before or at slot start → candidate for "before" gap
      if (block.end <= slotStart) {
        const gap = slotStart - block.end;
        if (gap < gapBefore) gapBefore = gap;
      }

      // Blocks that start at or after slot end → candidate for "after" gap
      if (block.start >= slotEnd) {
        const gap = block.start - slotEnd;
        if (gap < gapAfter) gapAfter = gap;
      }
    }

    // Scoring:
    // +50 for being flush (≤ 5 min gap) on the "before" side
    // +50 for being flush on the "after" side
    // +30 bonus for filling a gap perfectly (flush on BOTH sides)
    // -1 * min(gapBefore, gapAfter) / 60000 as a tiebreaker (smaller gaps = better)
    let score = 0;

    const flushBefore = gapBefore <= FLUSH_THRESHOLD_MS && gapBefore !== Infinity;
    const flushAfter = gapAfter <= FLUSH_THRESHOLD_MS && gapAfter !== Infinity;

    if (flushBefore) score += 50;
    if (flushAfter) score += 50;
    if (flushBefore && flushAfter) score += 30; // Perfect gap fill bonus

    // Tiebreaker: prefer slots with smaller minimum gap
    const minGap = Math.min(
      gapBefore === Infinity ? 999999 : gapBefore,
      gapAfter === Infinity ? 999999 : gapAfter
    );
    score += Math.max(0, 20 - (minGap / 60_000)); // Up to +20 for very small gaps

    return {
      ...slot,
      score,
      isRecommended: false, // Set below
    };
  });

  // Sort: highest score first, then by time as tiebreaker
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.time.localeCompare(b.time);
  });

  // Mark the top N as recommended (only if they actually scored above baseline)
  const RECOMMEND_THRESHOLD = 20; // Must score at least this to be "recommended"
  let recommendedCount = 0;
  for (const slot of scored) {
    if (recommendedCount >= maxRecommended) break;
    if (slot.score >= RECOMMEND_THRESHOLD) {
      slot.isRecommended = true;
      recommendedCount++;
    }
  }

  return scored;
}
