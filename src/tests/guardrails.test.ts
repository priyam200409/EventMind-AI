import { describe, it, expect } from 'vitest';
import { checkBudget, findScheduleConflicts } from '../lib/guardrails';
import { Session } from '../types/blackboard';

describe('Deterministic Guardrails', () => {
  it('flags budget overruns accurately', () => {
    const quotes = [
      { category: 'Venue' as const, vendorName: 'Grand Hall', cost: 30000, rationale: 'Fits 500' },
      { category: 'Catering' as const, vendorName: 'Bistro', cost: 25000, rationale: 'Full day' },
    ];
    expect(checkBudget(quotes, 50000).valid).toBe(false);
    expect(checkBudget(quotes, 60000).remaining).toBe(5000);
  });

  it('detects room clashes and capacity overflows', () => {
    const sessions: Session[] = [
      { id: '1', title: 'Keynote', speaker: 'Dr. Rao', track: 'AI', room: 'Hall A', roomCapacity: 100, startTime: '09:00', endTime: '10:00', expectedAttendance: 150 },
      { id: '2', title: 'Panel', speaker: 'Ms. Sen', track: 'Cloud', room: 'Hall A', roomCapacity: 100, startTime: '09:30', endTime: '10:30', expectedAttendance: 80 },
    ];
    const conflicts = findScheduleConflicts(sessions);
    expect(conflicts).toHaveLength(2);
  });
});