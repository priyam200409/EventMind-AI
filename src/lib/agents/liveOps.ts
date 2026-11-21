import { z } from 'zod';
import {
  ApprovalGate,
  Session,
  SessionSchema,
  ToolCallTrace,
} from '@/types/blackboard';
import { VENUE_ROOMS } from '@/lib/presets';
import { runReActToolAgent } from '@/lib/ai';
import {
  AuditScheduleInputSchema,
  auditScheduleConflictsTool,
  DispatchWhatsAppAlertInputSchema,
  dispatchWhatsAppAlertTool,
} from '@/lib/tools/eventTools';

export async function runLiveOpsAgent(
  sessions: Session[],
  crisis: string,
  city = 'Bengaluru'
): Promise<{
  updatedSessions: Session[];
  alertMessage: string;
  whatsappBroadcast: string;
  resolutionSummary: string;
  approvalGate: ApprovalGate | null;
  toolTraces: ToolCallTrace[];
}> {
  const { result, traces } = await runReActToolAgent({
    systemPrompt: `You are an autonomous Indian Enterprise LiveOps Crisis Commander. You resolve live disruptions (traffic gridlock, monsoon delays, room overflows, AV failures) by re-routing sessions, mathematically verifying zero conflicts, and preparing WhatsApp/SMS attendee alerts.`,
    userPrompt: `CITY: ${city}
LIVE EVENT CRISIS: "${crisis}"
CURRENT SCHEDULE: ${JSON.stringify(sessions)}
AVAILABLE ROOMS: ${JSON.stringify(VENUE_ROOMS)}

INSTRUCTIONS:
1. Adjust only the affected sessions (shift IST times or move rooms within capacity) to resolve the disruption while keeping unaffected sessions intact.
2. Call "auditScheduleConflicts" with your proposed "sessions" array to verify conflictCount === 0 and no capacity overflows.
3. Call "dispatchWhatsAppAlert" to prepare the attendee & venue staff WhatsApp/SMS notification.
4. Return the verified "updatedSessions", "alertMessage", and "resolutionSummary".`,
    tools: {
      auditScheduleConflicts: {
        description:
          'Audits updated sessions for room clashes, speaker double-bookings, and room capacity overflows. Args: {"sessions": Session[]}',
        inputSchema: AuditScheduleInputSchema,
        execute: (args) => auditScheduleConflictsTool(args),
      },
      dispatchWhatsAppAlert: {
        description:
          'Formats and queues a WhatsApp Business + SMS emergency alert for impacted attendees. Args: {"city": string, "affectedSessionTitle": string, "newRoomOrTime": string, "impactedAttendees": number, "shortMessage": string}',
        inputSchema: DispatchWhatsAppAlertInputSchema,
        execute: (args) => dispatchWhatsAppAlertTool(args),
      },
    },
    outputSchema: z.object({
      updatedSessions: z.array(SessionSchema),
      alertMessage: z.string(),
      resolutionSummary: z.string(),
    }),
  });

  const maxImpacted = result.updatedSessions.reduce(
    (max, s) => Math.max(max, s.expectedAttendance),
    0
  );
  const isMajorChange =
    crisis.toLowerCase().includes('keynote') ||
    crisis.toLowerCase().includes('overflow') ||
    maxImpacted >= 300;

  const approvalGate: ApprovalGate | null = isMajorChange
    ? {
        id: `hitl-ops-${Date.now()}`,
        agent: 'LiveOps',
        reason: `Major live schedule mutation in ${city} impacting up to ${maxImpacted} attendees.`,
        impactSummary: result.resolutionSummary,
        status: 'pending',
      }
    : null;

  const whatsappBroadcast = `[EventMind Ops • ${city}] ${result.alertMessage}`;

  return {
    updatedSessions: result.updatedSessions,
    alertMessage: result.alertMessage,
    whatsappBroadcast,
    resolutionSummary: `${result.resolutionSummary} (${traces.length} tool checks verified)`,
    approvalGate,
    toolTraces: traces,
  };
}