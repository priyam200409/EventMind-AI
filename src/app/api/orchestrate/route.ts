import { NextResponse } from 'next/server';
import { EventBriefSchema, SessionSchema, VendorQuoteSchema, AgentLog } from '@/types/blackboard';
import { runProcurementAgent } from '@/lib/agents/procurement';
import { runSchedulerAgent } from '@/lib/agents/scheduler';
import { runLiveOpsAgent } from '@/lib/agents/liveOps';
import { runRoiMatchAgent } from '@/lib/agents/roiMatch';
import { z } from 'zod';

const RequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('plan'), brief: EventBriefSchema }),
  z.object({ action: z.literal('crisis'), sessions: z.array(SessionSchema), crisis: z.string().min(3) }),
  z.object({ action: z.literal('roi'), brief: EventBriefSchema, quotes: z.array(VendorQuoteSchema), sessions: z.array(SessionSchema) }),
]);

const log = (agent: AgentLog['agent'], message: string, status: AgentLog['status'] = 'info'): AgentLog => ({
  agent,
  message,
  status,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
});

export async function POST(req: Request) {
  try {
    const body = RequestSchema.parse(await req.json());

    if (body.action === 'plan') {
      const [proc, sched] = await Promise.all([
        runProcurementAgent(body.brief),
        runSchedulerAgent(body.brief),
      ]);

      return NextResponse.json({
        quotes: proc.quotes,
        sessions: sched.sessions,
        conflictsResolved: sched.conflictsResolved,
        logs: [
          log('Orchestrator', `Initialized autonomous planning for "${body.brief.title}".`),
          log('Procurement', proc.logMessage, 'success'),
          log('Critic', sched.criticNotes, 'success'),
        ],
      });
    }

    if (body.action === 'crisis') {
      const res = await runLiveOpsAgent(body.sessions, body.crisis);
      return NextResponse.json({
        sessions: res.updatedSessions,
        alertMessage: res.alertMessage,
        logs: [
          log('LiveOps', `Crisis detected: ${body.crisis}`, 'warning'),
          log('LiveOps', res.resolutionSummary, 'success'),
        ],
      });
    }

    const roi = await runRoiMatchAgent(body.brief, body.quotes, body.sessions);
    return NextResponse.json({
      roi,
      logs: [log('ROI', `Computed ${roi.projectedLeads} qualified leads (${roi.roiMultiplier} ROEI).`, 'success')],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Orchestration error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}