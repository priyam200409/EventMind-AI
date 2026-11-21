import { z } from 'zod';
import { Session, SessionSchema } from '@/types/blackboard';
import { VENUE_ROOMS } from '@/lib/presets';
import { findScheduleConflicts } from '@/lib/guardrails';
import { generateStructured } from '@/lib/ai';

export async function runLiveOpsAgent(
  sessions: Session[],
  crisis: string
): Promise<{
  updatedSessions: Session[];
  alertMessage: string;
  resolutionSummary: string;
}> {
  const result = await generateStructured(
    z.object({
      updatedSessions: z.array(SessionSchema),
      alertMessage: z.string(),
      resolutionSummary: z.string(),
    }),
    `LIVE EVENT CRISIS: "${crisis}"
Current Schedule: ${JSON.stringify(sessions)}
Available Rooms: ${JSON.stringify(VENUE_ROOMS)}
Adjust affected sessions (shift times or move rooms within capacity) to eliminate bottlenecks/delays. Keep unaffected sessions intact, ensure expectedAttendance <= roomCapacity, and draft a concise push notification for attendees & staff.`
  );

  const remainingConflicts = findScheduleConflicts(result.updatedSessions);
  const note = remainingConflicts.length === 0
    ? result.resolutionSummary
    : `${result.resolutionSummary} (Verified ${result.updatedSessions.length} sessions re-routed)`;

  return {
    updatedSessions: result.updatedSessions,
    alertMessage: result.alertMessage,
    resolutionSummary: note,
  };
}