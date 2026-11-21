import { Session, VendorQuote } from '@/types/blackboard';

export const GST_RATE = 0.18; // Standard 18% Indian GST for Event Services

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function calculateGstBreakdown(baseAmount: number) {
  const gstAmount = Math.round(baseAmount * GST_RATE);
  const cgst = Math.round(gstAmount / 2);
  const sgst = gstAmount - cgst;
  return {
    baseAmount,
    cgst,
    sgst,
    gstAmount,
    totalWithGst: baseAmount + gstAmount,
  };
}

export function checkBudget(
  quotes: VendorQuote[],
  maxBudgetInr: number,
  includeGst = true
) {
  const baseTotal = quotes.reduce((sum, q) => sum + q.cost, 0);
  const tax = includeGst
    ? calculateGstBreakdown(baseTotal)
    : { baseAmount: baseTotal, cgst: 0, sgst: 0, gstAmount: 0, totalWithGst: baseTotal };

  const grandTotal = tax.totalWithGst;
  const utilizationPct = Math.round((grandTotal / maxBudgetInr) * 100);
  const requiresHitlApproval =
    grandTotal > maxBudgetInr ||
    utilizationPct >= 92 ||
    quotes.some((q) => q.cost >= 2000000);

  return {
    withinBudget: grandTotal <= maxBudgetInr,
    total: grandTotal,
    baseTotal,
    gstAmount: tax.gstAmount,
    cgst: tax.cgst,
    sgst: tax.sgst,
    remaining: maxBudgetInr - grandTotal,
    utilizationPct,
    requiresHitlApproval,
  };
}

export function findScheduleConflicts(sessions: Session[]): string[] {
  const errors: string[] = [];
  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  for (let i = 0; i < sessions.length; i++) {
    const a = sessions[i];
    if (a.expectedAttendance > a.roomCapacity) {
      errors.push(
        `Capacity overflow in "${a.title}": ${a.expectedAttendance} > ${a.roomCapacity} (${a.room}).`
      );
    }
    for (let j = i + 1; j < sessions.length; j++) {
      const b = sessions[j];
      const overlap =
        toMinutes(a.startTime) < toMinutes(b.endTime) &&
        toMinutes(b.startTime) < toMinutes(a.endTime);

      if (overlap && a.room === b.room) {
        errors.push(`Room clash in ${a.room}: "${a.title}" overlaps "${b.title}".`);
      }
      if (overlap && a.speaker === b.speaker) {
        errors.push(`Speaker clash for ${a.speaker}: "${a.title}" overlaps "${b.title}".`);
      }
    }
  }
  return errors;
}