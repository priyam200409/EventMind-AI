import { Session, VendorQuote } from '@/types/blackboard';

export function checkBudget(quotes: VendorQuote[], maxBudget: number) {
  const total = quotes.reduce((sum, q) => sum + q.cost, 0);
  return { valid: total <= maxBudget, total, remaining: maxBudget - total };
}

export function findScheduleConflicts(sessions: Session[]): string[] {
  const issues: string[] = [];

  for (let i = 0; i < sessions.length; i++) {
    const a = sessions[i];
    if (a.expectedAttendance > a.roomCapacity) {
      issues.push(`Capacity overflow in ${a.room} for "${a.title}" (${a.expectedAttendance}/${a.roomCapacity})`);
    }

    for (let j = i + 1; j < sessions.length; j++) {
      const b = sessions[j];
      const overlaps = a.startTime < b.endTime && b.startTime < a.endTime;
      if (!overlaps) continue;

      if (a.room === b.room) {
        issues.push(`Room clash in ${a.room}: "${a.title}" & "${b.title}" (${a.startTime}-${a.endTime})`);
      }
      if (a.speaker === b.speaker) {
        issues.push(`Speaker clash for ${a.speaker}: "${a.title}" & "${b.title}"`);
      }
    }
  }
  return issues;
}