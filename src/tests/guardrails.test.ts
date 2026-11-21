import { describe, it, expect } from 'vitest';
import {
  calculateGstBreakdown,
  checkBudget,
  findScheduleConflicts,
  formatINR,
} from '@/lib/guardrails';

describe('Deterministic Guardrails & Indian GST Engine', () => {
  it('formats INR currency using Indian lakh/crore grouping', () => {
    expect(formatINR(4500000)).toBe('₹45,00,000');
  });

  it('computes 18% GST split accurately into 9% CGST and 9% SGST', () => {
    const tax = calculateGstBreakdown(1000000);
    expect(tax.cgst).toBe(90000);
    expect(tax.sgst).toBe(90000);
    expect(tax.gstAmount).toBe(180000);
    expect(tax.totalWithGst).toBe(1180000);
  });

  it('flags budget overruns accurately including 18% GST', () => {
    const quotes = [
      { category: 'Venue' as const, vendorName: 'BIEC Hall', cost: 2500000, rationale: 'Main hall' },
      { category: 'Catering' as const, vendorName: 'Sattvam', cost: 1500000, rationale: 'Jain & Veg' },
    ];
    // Base = ₹40,00,000 + 18% GST (₹7,20,000) = ₹47,20,000 > ₹45,00,000
    const result = checkBudget(quotes, 4500000, true);
    expect(result.withinBudget).toBe(false);
    expect(result.gstAmount).toBe(720000);
    expect(result.total).toBe(4720000);
    expect(result.requiresHitlApproval).toBe(true);
  });

  it('detects room clashes and capacity overflows', () => {
    const sessions = [
      {
        id: '1',
        title: 'Keynote',
        track: 'AI',
        speaker: 'Dr. Rao',
        room: 'Main Hall',
        startTime: '09:00',
        endTime: '10:30',
        expectedAttendance: 320,
        roomCapacity: 300,
      },
      {
        id: '2',
        title: 'Cloud Talk',
        track: 'Cloud',
        speaker: 'Priya Nair',
        room: 'Main Hall',
        startTime: '10:00',
        endTime: '11:00',
        expectedAttendance: 150,
        roomCapacity: 300,
      },
    ];
    const errors = findScheduleConflicts(sessions);
    expect(errors.length).toBe(2);
  });
});