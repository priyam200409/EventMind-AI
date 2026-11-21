import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/orchestrate/route';
import { DEMO_PRESET } from '@/lib/presets';

vi.mock('@/lib/agents/procurement', () => ({
  runProcurementAgent: vi.fn(async () => ({
    quotes: [
      {
        category: 'Venue',
        vendorName: 'BIEC Convention Hall 3 (Tumkur Rd)',
        cost: 1450000,
        gstAmount: 261000,
        totalWithGst: 1711000,
        rationale: 'Metro access and 500 KVA DG backup.',
      },
    ],
    gstSummary: {
      withinBudget: true,
      total: 1711000,
      baseTotal: 1450000,
      gstAmount: 261000,
      cgst: 130500,
      sgst: 130500,
      remaining: 2789000,
      utilizationPct: 38,
      requiresHitlApproval: false,
    },
    approvalGate: null,
    toolTraces: [
      {
        toolName: 'searchIndianVendors',
        inputSummary: '{"city":"Bengaluru"}',
        outputSummary: '{"vendors":6}',
        durationMs: 2,
      },
    ],
    logMessage: 'Executed 1 tool for Bengaluru.',
  })),
}));

vi.mock('@/lib/agents/scheduler', () => ({
  runSchedulerAgent: vi.fn(async () => ({
    sessions: [
      {
        id: 's1',
        title: 'Opening Keynote: Agentic Systems in India',
        track: 'Agentic AI',
        speaker: 'Dr. Ananya Sharma',
        room: 'Main Keynote Hall',
        startTime: '09:30',
        endTime: '11:00',
        expectedAttendance: 420,
        roomCapacity: 500,
      },
    ],
    conflictsResolved: 0,
    criticNotes: 'Critic verified 0 schedule conflicts.',
    toolTraces: [],
  })),
}));

describe('Orchestrator API Route (/api/orchestrate)', () => {
  it('rejects invalid event briefs below minimum INR budget with HTTP 400', async () => {
    const req = new Request('http://localhost:3000/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'plan',
        brief: { ...DEMO_PRESET, budget: 1000 }, // Below ₹50,000 minimum
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('orchestrates procurement and scheduling cleanly for valid Indian briefs', async () => {
    const req = new Request('http://localhost:3000/api/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'plan',
        brief: DEMO_PRESET,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.quotes).toHaveLength(1);
    expect(data.sessions).toHaveLength(1);
    expect(data.gstSummary.gstAmount).toBe(261000);
    expect(data.logs).toHaveLength(3);
  });
});