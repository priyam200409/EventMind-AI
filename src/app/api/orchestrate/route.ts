import { NextResponse } from 'next/server';
import {
  AgentLog,
  EventBriefSchema,
  SessionSchema,
  VendorQuoteSchema,
} from '@/types/blackboard';
import { runProcurementAgent } from '@/lib/agents/procurement';
import { runSchedulerAgent } from '@/lib/agents/scheduler';
import { runLiveOpsAgent } from '@/lib/agents/liveOps';
import { runRoiMatchAgent } from '@/lib/agents/roiMatch';
import { z } from 'zod';

const RequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('plan'), brief: EventBriefSchema }),
  z.object({
    action: z.literal('crisis'),
    sessions: z.array(SessionSchema),
    crisis: z.string().min(3),
    city: z.string().optional(),
  }),
  z.object({
    action: z.literal('roi'),
    brief: EventBriefSchema,
    quotes: z.array(VendorQuoteSchema),
    sessions: z.array(SessionSchema),
  }),
]);

const log = (
  agent: AgentLog['agent'],
  message: string,
  status: AgentLog['status'] = 'info',
  toolTraces?: AgentLog['toolTraces']
): AgentLog => ({
  agent,
  message,
  status,
  timestamp: new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }),
  toolTraces,
});

export async function POST(req: Request) {
  try {
    const body = RequestSchema.parse(await req.json());

    if (body.action === 'plan') {
      const city = body.brief.city ?? 'Bengaluru';
      const [proc, sched] = await Promise.all([
        runProcurementAgent(body.brief),
        runSchedulerAgent(body.brief),
      ]);

      return NextResponse.json({
        quotes: proc.quotes,
        gstSummary: proc.gstSummary,
        approvalGate: proc.approvalGate,
        sessions: sched.sessions,
        conflictsResolved: sched.conflictsResolved,
        logs: [
          log(
            'Orchestrator',
            `Initialized Indian enterprise workflow for "${body.brief.title}" (${city}).`
          ),
          log(
            'Procurement',
            proc.logMessage,
            proc.approvalGate ? 'warning' : 'success',
            proc.toolTraces
          ),
          log('Critic', sched.criticNotes, 'success', sched.toolTraces),
        ],
      });
    }

    if (body.action === 'crisis') {
      const city = body.city ?? 'Bengaluru';
      const res = await runLiveOpsAgent(body.sessions, body.crisis, city);
      return NextResponse.json({
        sessions: res.updatedSessions,
        alertMessage: res.alertMessage,
        whatsappBroadcast: res.whatsappBroadcast,
        approvalGate: res.approvalGate,
        logs: [
          log('LiveOps', `[${city}] Crisis detected: ${body.crisis}`, 'warning'),
          log(
            'LiveOps',
            res.resolutionSummary,
            'success',
            res.toolTraces
          ),
        ],
      });
    }

    const { roi, toolTraces } = await runRoiMatchAgent(
      body.brief,
      body.quotes,
      body.sessions
    );
    return NextResponse.json({
      roi,
      logs: [
        log(
          'ROI',
          `Computed ${roi.projectedLeads} qualified leads (${roi.roiMultiplier} ROEI • ${roi.projectedPipelineInr} pipeline).`,
          'success',
          toolTraces
        ),
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Orchestration error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}