import { describe, it, expect } from 'vitest';
import {
  auditScheduleConflictsTool,
  calculateCateringAndGstTool,
  dispatchWhatsAppAlertTool,
  searchIndianVendorsTool,
} from '@/lib/tools/eventTools';

describe('Executable Indian Event Tools', () => {
  it('filters Mumbai caterers by Jain kitchen certification', () => {
    const res = searchIndianVendorsTool({
      city: 'Mumbai',
      requireJainCatering: true,
    });
    const caterers = res.vendors.filter((v) => v.category === 'Catering');
    expect(caterers.length).toBe(1);
    expect(caterers[0].jainCertified).toBe(true);
  });

  it('computes dietary plate splits and 18% GST grand total accurately', () => {
    const res = calculateCateringAndGstTool({
      attendees: 400,
      venueCostInr: 1200000,
      cateringPerHeadInr: 1500,
      avCostInr: 500000,
      maxBudgetInr: 3000000,
      includeGst: true,
      dietarySplit: { vegPct: 50, jainPct: 25, nonVegPct: 25 },
    });

    expect(res.plateBreakdown).toEqual({
      vegPlates: 200,
      jainPlates: 100,
      nonVegPlates: 100,
    });
    expect(res.grandTotalWithGst).toBe(2714000);
    expect(res.withinBudget).toBe(true);
  });

  it('audits clean schedules with zero conflicts', () => {
    const audit = auditScheduleConflictsTool({
      sessions: [
        {
          id: 's1',
          title: 'Opening Keynote',
          track: 'Agentic AI',
          speaker: 'Dr. Ananya Sharma',
          room: 'Main Keynote Hall',
          startTime: '09:30',
          endTime: '11:00',
          expectedAttendance: 420,
          roomCapacity: 500,
        },
      ],
    });
    expect(audit.status).toBe('CLEAN');
    expect(audit.conflictCount).toBe(0);
  });

  it('queues WhatsApp broadcast for HITL approval when >= 250 attendees are impacted', () => {
    const alert = dispatchWhatsAppAlertTool({
      city: 'Bengaluru',
      affectedSessionTitle: 'Opening Keynote',
      newRoomOrTime: '10:15 IST',
      impactedAttendees: 420,
      shortMessage: 'Keynote shifted by 45 mins due to ORR traffic.',
    });
    expect(alert.requiresHitlApproval).toBe(true);
    expect(alert.deliveryStatus).toBe('QUEUED_FOR_OPS_APPROVAL');
  });
});