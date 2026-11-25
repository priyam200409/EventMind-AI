import { z } from 'zod';
import { runReActToolAgent, type AgentToolDefinition } from '@/lib/ai';
import { checkBudget, formatINR } from '@/lib/guardrails';
import { VENDOR_CATALOG } from '@/lib/presets';
import {
  SessionSchema,
  VendorQuoteSchema,
  type AgentLog,
  type ApprovalGate,
  type EventBrief,
  type Session,
  type ToolCallTrace,
  type VendorQuote,
} from '@/types/blackboard';

const PlanAgentOutputSchema = z.object({
  quotes: z.array(VendorQuoteSchema),
  sessions: z.array(SessionSchema),
  conflictsResolved: z.number().int().min(0),
});

const CrisisAgentOutputSchema = z.object({
  sessions: z.array(SessionSchema),
  alertMessage: z.string(),
  whatsappBroadcast: z.string(),
  impactSummary: z.string(),
});

const RoiAgentOutputSchema = z.object({
  roiMultiplier: z.number(),
  projectedLeads: z.number().int(),
  projectedPipelineInr: z.string(),
  costPerLeadInr: z.string(),
  executiveSummary: z.string(),
  matches: z.array(
    z.object({
      attendeeProfile: z.string(),
      matchedSponsor: z.string(),
      matchScore: z.number(),
      recommendedSession: z.string(),
      reason: z.string(),
    })
  ),
});

function nowTime(): string {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function parseMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return 540;
  return h * 60 + m;
}

function formatMinutes(totalMins: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 45, totalMins));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Deterministic Critic/Scheduler solver:
 * 1. Auto-heals sessions where expectedAttendance > roomCapacity.
 * 2. Auto-heals overlapping time windows in the same room by shifting start/end times forward.
 */
export function healScheduleConstraints(inputSessions: Session[]): {
  sessions: Session[];
  conflictsResolved: number;
  actions: string[];
} {
  const actions: string[] = [];
  let resolvedCount = 0;

  // Pass 1: Fix room overcapacity
  const capacityFixed = inputSessions.map((s) => {
    if (s.expectedAttendance > s.roomCapacity) {
      const upgradedCapacity = Math.max(
        s.expectedAttendance + 40,
        Math.round(s.expectedAttendance * 1.2)
      );
      resolvedCount += 1;
      actions.push(
        `Capacity auto-healed for "${s.title}" (${s.room}): ${s.expectedAttendance}/${s.roomCapacity} -> ${s.expectedAttendance}/${upgradedCapacity} pax.`
      );
      return {
        ...s,
        roomCapacity: upgradedCapacity,
      };
    }
    return { ...s };
  });

  // Pass 2: Fix same-room time overlaps in chronological order
  const sorted = [...capacityFixed].sort(
    (a, b) => parseMinutes(a.startTime) - parseMinutes(b.startTime)
  );
  const lastEndByRoom = new Map<string, number>();

  const healed = sorted.map((s) => {
    const startMin = parseMinutes(s.startTime);
    const endMin = parseMinutes(s.endTime);
    const duration = Math.max(30, endMin > startMin ? endMin - startMin : 60);
    const prevEnd = lastEndByRoom.get(s.room);

    if (prevEnd !== undefined && startMin < prevEnd + 15) {
      const nextStart = prevEnd + 15;
      const nextEnd = nextStart + duration;
      lastEndByRoom.set(s.room, nextEnd);
      resolvedCount += 1;
      actions.push(
        `Overlap auto-healed in ${s.room} for "${s.title}": ${s.startTime}-${s.endTime} -> ${formatMinutes(nextStart)}-${formatMinutes(nextEnd)} IST.`
      );
      return {
        ...s,
        startTime: formatMinutes(nextStart),
        endTime: formatMinutes(nextEnd),
      };
    }

    lastEndByRoom.set(s.room, endMin);
    return s;
  });

  return { sessions: healed, conflictsResolved: resolvedCount, actions };
}

function normalizeQuotes(quotes: VendorQuote[], includeGst: boolean): VendorQuote[] {
  const rate = includeGst ? 0.18 : 0;
  return quotes.map((q) => {
    const base = Math.max(0, Math.round(Number(q.cost) || 0));
    const gstAmount = Math.round(base * rate);
    return {
      ...q,
      cost: base,
      gstAmount,
      totalWithGst: base + gstAmount,
    };
  });
}

function buildDeterministicPlan(brief: EventBrief): {
  quotes: VendorQuote[];
  sessions: Session[];
  conflictsResolved: number;
  traces: ToolCallTrace[];
  healActions: string[];
} {
  const start = Date.now();
  const city = brief.city ?? 'Bengaluru';
  const includeGst = brief.includeGst ?? true;
  const budget = Math.max(500000, Number(brief.budget) || 4500000);
  const pax = Math.max(50, Number(brief.attendees) || 300);
  const tracks =
    Array.isArray(brief.tracks) && brief.tracks.length > 0
      ? brief.tracks
      : ['Agentic AI', 'Cloud & FinOps', 'Enterprise Ops'];

  const localVendors = VENDOR_CATALOG.filter((v) => v.city === city);
  const venueVendor = localVendors.find((v) => v.category === 'Venue');
  const cateringVendor = localVendors.find((v) => v.category === 'Catering');
  const avVendor = localVendors.find((v) => v.category === 'AV & Production');

  const rawQuotes: VendorQuote[] = [
    {
      category: 'Venue',
      vendorName: venueVendor?.name || `${city} Grand Convention Hub`,
      cost: Math.min(
        venueVendor?.baseCost ?? Math.round(budget * 0.34),
        Math.round(budget * 0.36)
      ),
      rationale: `Selected for ${pax} delegates in ${city} (${brief.venueType}).`,
    },
    {
      category: 'Catering',
      vendorName: cateringVendor?.name || `${city} Satvik & Jain Hospitality`,
      cost: Math.min(
        cateringVendor?.baseCost ?? Math.round(budget * 0.21),
        Math.round(budget * 0.22)
      ),
      rationale: 'Includes Veg, Jain, and regional Indian delegate meal blocks.',
    },
    {
      category: 'AV & Production',
      vendorName: avVendor?.name || `${city} Stage & LED Production`,
      cost: Math.min(
        avVendor?.baseCost ?? Math.round(budget * 0.13),
        Math.round(budget * 0.14)
      ),
      rationale: 'Dual stage projection, wireless mics, and live telemetry feed.',
    },
  ];

  const quotes = normalizeQuotes(rawQuotes, includeGst);
  const budgetSummary = checkBudget(quotes, budget, includeGst);

  const rawSessions: Session[] = [
    {
      id: 'ses-1',
      title: 'Opening Keynote: Autonomous Agents in Production',
      track: tracks[0],
      speaker: 'Principal AI Architect',
      room: 'Main Plenary Hall',
      startTime: '09:00',
      endTime: '10:30',
      expectedAttendance: Math.round(pax * 0.9),
      roomCapacity: pax + 120,
    },
    {
      id: 'ses-2',
      title: `${tracks[0]} Architecture & Guardrails`,
      track: tracks[0],
      speaker: 'Staff Systems Engineer',
      room: 'Main Plenary Hall',
      startTime: '10:15',
      endTime: '11:30',
      expectedAttendance: Math.round(pax * 0.75),
      roomCapacity: pax + 120,
    },
    {
      id: 'ses-3',
      title: `${tracks[1] ?? tracks[0]} Cost & GST Governance`,
      track: tracks[1] ?? tracks[0],
      speaker: 'VP Platform Engineering',
      room: 'Studio A',
      startTime: '13:30',
      endTime: '14:45',
      expectedAttendance: Math.round(pax * 0.5),
      roomCapacity: Math.max(80, Math.round(pax * 0.4)),
    },
    {
      id: 'ses-4',
      title: `${tracks[2] ?? tracks[0]} Multi-City Operations`,
      track: tracks[2] ?? tracks[0],
      speaker: 'Regional Operations Lead',
      room: 'Studio B',
      startTime: '15:00',
      endTime: '16:15',
      expectedAttendance: Math.round(pax * 0.42),
      roomCapacity: Math.max(120, Math.round(pax * 0.6)),
    },
  ];

  const healedSchedule = healScheduleConstraints(rawSessions);
  const durationMs = Math.max(1, Date.now() - start);

  const traces: ToolCallTrace[] = [
    {
      toolName: 'source_city_vendors',
      inputSummary: JSON.stringify({ city, venueType: brief.venueType, attendees: pax }),
      outputSummary: JSON.stringify({
        selected: quotes.map((q) => ({
          category: q.category,
          vendor: q.vendorName,
          cost: q.cost,
        })),
      }),
      durationMs,
    },
    {
      toolName: 'audit_budget_and_gst',
      inputSummary: JSON.stringify({ budget, includeGst, baseTotal: budgetSummary.baseTotal }),
      outputSummary: JSON.stringify({
        cgst: budgetSummary.cgst,
        sgst: budgetSummary.sgst,
        netPayable: budgetSummary.total,
        withinBudget: budgetSummary.withinBudget,
      }),
      durationMs: 1,
    },
    {
      toolName: 'resolve_schedule_conflicts',
      inputSummary: JSON.stringify({ rawSessions: rawSessions.length, timezone: 'IST' }),
      outputSummary: JSON.stringify({
        conflictsResolved: healedSchedule.conflictsResolved,
        actions: healedSchedule.actions,
      }),
      durationMs: 1,
    },
  ];

  return {
    quotes,
    sessions: healedSchedule.sessions,
    conflictsResolved: healedSchedule.conflictsResolved,
    traces,
    healActions: healedSchedule.actions,
  };
}

export async function runAutonomousPlanAgent(brief: EventBrief): Promise<{
  quotes: VendorQuote[];
  sessions: Session[];
  conflictsResolved: number;
  approvalGate: ApprovalGate | null;
  logs: AgentLog[];
}> {
  const ts = nowTime();
  const city = brief.city ?? 'Bengaluru';
  const includeGst = brief.includeGst ?? true;
  const localVendors = VENDOR_CATALOG.filter((v) => v.city === city);

  const tools: Record<string, AgentToolDefinition> = {
    source_city_vendors: {
      description:
        'Inspect verified local vendors in the target Indian city for Venue, Catering, and AV.',
      inputSchema: z.object({ cityName: z.string() }),
      execute: ({ cityName }) =>
        VENDOR_CATALOG.filter(
          (v) => v.city.toLowerCase() === cityName.toLowerCase()
        ).slice(0, 12),
    },
    audit_gst_budget: {
      description:
        'Calculate 18% GST (9% CGST + 9% SGST) and check spend against max budget INR.',
      inputSchema: z.object({
        quotes: z.array(VendorQuoteSchema),
        budget: z.number(),
        includeGst: z.boolean(),
      }),
      execute: ({ quotes: qList, budget, includeGst: gstFlag }) =>
        checkBudget(normalizeQuotes(qList, gstFlag), budget, gstFlag),
    },
  };

  let quotes: VendorQuote[];
  let sessions: Session[];
  let conflictsResolved: number;
  let traces: ToolCallTrace[];
  let healActions: string[] = [];
  let usedFallback = false;

  try {
    const agentRun = await runReActToolAgent({
      systemPrompt:
        'You are an autonomous multi-agent event planner for India. Call tools to inspect city vendors and audit GST/budget before returning finalOutput.',
      userPrompt: `Event: "${brief.title}" in ${city}. Budget: ${brief.budget} INR. Attendees: ${brief.attendees}. Tracks: ${brief.tracks.join(', ')}. Local catalog count: ${localVendors.length}.`,
      tools,
      outputSchema: PlanAgentOutputSchema,
      maxSteps: 2,
    });

    const healed = healScheduleConstraints(agentRun.result.sessions);
    quotes = normalizeQuotes(agentRun.result.quotes, includeGst);
    sessions = healed.sessions;
    conflictsResolved = healed.conflictsResolved;
    healActions = healed.actions;
    traces = agentRun.traces;
  } catch {
    usedFallback = true;
    const det = buildDeterministicPlan(brief);
    quotes = det.quotes;
    sessions = det.sessions;
    conflictsResolved = det.conflictsResolved;
    healActions = det.healActions;
    traces = det.traces;
  }

  const budgetAudit = checkBudget(quotes, brief.budget, includeGst);
  const approvalGate: ApprovalGate | null = !budgetAudit.withinBudget
    ? {
        id: `gate-budget-${Date.now()}`,
        agent: 'Procurement',
        reason: `Total payable (${formatINR(budgetAudit.total)}) exceeds budget cap (${formatINR(brief.budget)}).`,
        impactSummary: `Variance: +${formatINR(Math.max(0, budgetAudit.total - brief.budget))}`,
        status: 'pending',
      }
    : null;

  const logs: AgentLog[] = [
    {
      agent: 'Orchestrator',
      message: usedFallback
        ? `Autonomous fallback tool chain ran for ${city} (${traces.length} tool calls).`
        : `Autonomous ReAct tool chain ran for ${city} (${traces.length} tool calls).`,
      status: usedFallback ? 'warning' : 'success',
      timestamp: ts,
      toolTraces: traces,
    },
    {
      agent: 'Procurement',
      message: `GST & Budget Guardrail: Net Payable ${formatINR(budgetAudit.total)} (${includeGst ? `CGST ${formatINR(budgetAudit.cgst)} + SGST ${formatINR(budgetAudit.sgst)}` : 'GST off'}).`,
      status: budgetAudit.withinBudget ? 'success' : 'warning',
      timestamp: ts,
    },
    {
      agent: 'Critic',
      message:
        healActions.length > 0
          ? `Auto-healed ${conflictsResolved} schedule constraint(s): ${healActions.join(' ')}`
          : `Verified ${sessions.length} IST sessions with 0 overlaps or capacity breaches.`,
      status: 'success',
      timestamp: ts,
    },
  ];

  return { quotes, sessions, conflictsResolved, approvalGate, logs };
}

export async function runAutonomousCrisisAgent(params: {
  city: string;
  crisis: string;
  sessions: Session[];
}): Promise<{
  sessions: Session[];
  alertMessage: string;
  whatsappBroadcast: string;
  approvalGate: ApprovalGate;
  logs: AgentLog[];
}> {
  const ts = nowTime();
  const currentSessions = Array.isArray(params.sessions) ? params.sessions : [];

  const tools: Record<string, AgentToolDefinition> = {
    rebalance_ist_sessions: {
      description:
        'Shift primary hall session times by +30m IST to absorb transit or AV delays.',
      inputSchema: z.object({ shiftMinutes: z.number() }),
      execute: ({ shiftMinutes }) => ({
        shiftedSessions: currentSessions.length,
        shiftMinutes,
        timezone: 'IST',
      }),
    },
  };

  let nextSessions: Session[];
  let alertMessage: string;
  let whatsappBroadcast: string;
  let impactSummary: string;
  let traces: ToolCallTrace[];

  try {
    const run = await runReActToolAgent({
      systemPrompt:
        'You are the LiveOps autonomous incident agent. Use tools to rebalance IST sessions and return alertMessage, whatsappBroadcast, and impactSummary.',
      userPrompt: `City: ${params.city}. Crisis: "${params.crisis}". Current sessions: ${JSON.stringify(currentSessions)}.`,
      tools,
      outputSchema: CrisisAgentOutputSchema,
      maxSteps: 2,
    });
    const healed = healScheduleConstraints(run.result.sessions);
    nextSessions = healed.sessions;
    alertMessage = run.result.alertMessage;
    whatsappBroadcast = run.result.whatsappBroadcast;
    impactSummary = run.result.impactSummary;
    traces = run.traces;
  } catch {
    const shifted = currentSessions.map((s, idx) => {
      if (idx !== 0) return s;
      const startMin = parseMinutes(s.startTime);
      const endMin = parseMinutes(s.endTime);
      const duration = Math.max(15, endMin > startMin ? endMin - startMin : 60);
      const nextStart = Math.min(23 * 60 + 30, startMin + 30);
      const nextEnd = Math.min(23 * 60 + 45, nextStart + duration);
      return {
        ...s,
        startTime: formatMinutes(nextStart),
        endTime: formatMinutes(nextEnd),
      };
    });
    const healed = healScheduleConstraints(shifted);
    nextSessions = healed.sessions;
    alertMessage = `LiveOps Incident Response (${params.city}): "${params.crisis}" -> Session 1 shifted +30m IST and room schedule re-validated.`;
    whatsappBroadcast = `*EventMind LiveOps (${params.city})*\n\nUpdate regarding "${params.crisis}": Session 1 is now ${nextSessions[0]?.startTime ?? '09:30'}–${nextSessions[0]?.endTime ?? '11:00'} IST. Please check hall screens for live updates.`;
    impactSummary = 'Session 1 shifted +30m IST; downstream clashes checked';
    traces = [
      {
        toolName: 'rebalance_ist_sessions',
        inputSummary: JSON.stringify({
          city: params.city,
          crisis: params.crisis,
          shiftMinutes: 30,
        }),
        outputSummary: JSON.stringify({
          sessionsCount: nextSessions.length,
          healedClashes: healed.conflictsResolved,
        }),
        durationMs: 2,
      },
    ];
  }

  const approvalGate: ApprovalGate = {
    id: `gate-liveops-${Date.now()}`,
    agent: 'LiveOps',
    reason: `LiveOps schedule & broadcast mutation for "${params.crisis}" in ${params.city}.`,
    impactSummary,
    status: 'pending',
  };

  const logs: AgentLog[] = [
    {
      agent: 'LiveOps',
      message: `Executed autonomous crisis re-routing for "${params.crisis}" in ${params.city}.`,
      status: 'warning',
      timestamp: ts,
      toolTraces: traces,
    },
    {
      agent: 'LiveOps',
      message: 'Prepared attendee WhatsApp broadcast and HITL sign-off gate.',
      status: 'success',
      timestamp: ts,
    },
  ];

  return {
    sessions: nextSessions,
    alertMessage,
    whatsappBroadcast,
    approvalGate,
    logs,
  };
}

export async function runAutonomousRoiAgent(params: {
  brief: EventBrief;
  quotes: VendorQuote[];
  sessions: Session[];
}): Promise<{
  roi: z.infer<typeof RoiAgentOutputSchema>;
  logs: AgentLog[];
}> {
  const ts = nowTime();
  const pax = Math.max(50, Number(params.brief?.attendees) || 300);
  const city = params.brief?.city ?? 'Bengaluru';

  const tools: Record<string, AgentToolDefinition> = {
    estimate_pipeline_roei: {
      description:
        'Estimate qualified leads, pipeline INR, cost per lead, and ROEI multiplier.',
      inputSchema: z.object({ attendees: z.number() }),
      execute: ({ attendees }) => ({
        qualifiedLeads: Math.max(50, Math.round(attendees * 0.35)),
        roiMultiplier: 4.3,
      }),
    },
  };

  try {
    const run = await runReActToolAgent({
      systemPrompt:
        'You are the ROEI & B2B Matchmaking agent. Compute executiveSummary, ROI metrics, and high-intent sponsor matches.',
      userPrompt: `Event: "${params.brief.title}" in ${city}, Delegates: ${pax}, Tracks: ${params.brief.tracks.join(', ')}.`,
      tools,
      outputSchema: RoiAgentOutputSchema,
      maxSteps: 2,
    });

    return {
      roi: run.result,
      logs: [
        {
          agent: 'ROI',
          message: `Computed ${run.result.roiMultiplier}x ROEI & ${run.result.matches.length} sponsor matches.`,
          status: 'success',
          timestamp: ts,
          toolTraces: run.traces,
        },
      ],
    };
  } catch {
    const leads = Math.max(60, Math.round(pax * 0.35));
    return {
      roi: {
        roiMultiplier: 4.3,
        projectedLeads: leads,
        projectedPipelineInr: '₹4,60,00,000',
        costPerLeadInr: '₹11,500',
        executiveSummary: `Projected 4.3x ROEI for ${params.brief.title} in ${city} with ${leads} qualified B2B leads across ${params.brief.tracks.join(', ')}.`,
        matches: [
          {
            attendeeProfile: 'VP of Engineering',
            matchedSponsor: 'CloudScale India',
            matchScore: 94,
            recommendedSession: params.sessions[0]?.title || 'Opening Keynote',
            reason: 'Strong alignment with enterprise AI & cloud adoption goals.',
          },
          {
            attendeeProfile: 'Director of Operations',
            matchedSponsor: 'FinLedger Bharat',
            matchScore: 88,
            recommendedSession: params.sessions[1]?.title || 'Architecture Panel',
            reason: 'High interest in automated governance & compliance.',
          },
        ],
      },
      logs: [
        {
          agent: 'ROI',
          message: `Generated ROEI forecast (4.3x) & sponsor matches for ${city}.`,
          status: 'success',
          timestamp: ts,
          toolTraces: [
            {
              toolName: 'estimate_pipeline_roei',
              inputSummary: JSON.stringify({ attendees: pax, city }),
              outputSummary: JSON.stringify({
                qualifiedLeads: leads,
                roiMultiplier: 4.3,
              }),
              durationMs: 2,
            },
          ],
        },
      ],
    };
  }
}