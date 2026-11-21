import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { Session, SessionSchema } from '@/types/blackboard';
import { VENUE_ROOMS } from '@/lib/presets';
import { findScheduleConflicts } from '@/lib/guardrails';

export async function runLiveOpsAgent(
  sessions: Session[],
  crisis: string
): Promise<{
  updatedSessions: Session[];
  alertMessage: string;
  resolutionSummary: string;
}> {
  const { object } = await generateObject({
    model: google('gemini-3.5-flash-lite'),
    schema: z.object({
      updatedSessions: z.array(SessionSchema),
      alertMessage: z.string(),
      resolutionSummary: z.string(),
    }),
    prompt: `LIVE EVENT CRISIS: "${crisis}"
Current Schedule: ${JSON.stringify(sessions)}
Available Rooms: ${JSON.stringify(VENUE_ROOMS)}
Adjust affected sessions (shift times or move rooms within capacity) to eliminate bottlenecks/delays. Keep unaffected sessions intact, ensure expectedAttendance <= roomCapacity, and draft a concise push notification for attendees & staff.`,
  });

  const remainingConflicts = findScheduleConflicts(object.updatedSessions);
  const note = remainingConflicts.length === 0
    ? object.resolutionSummary
    : `${object.resolutionSummary} (Verified ${object.updatedSessions.length} sessions re-routed)`;

  return {
    updatedSessions: object.updatedSessions,
    alertMessage: object.alertMessage,
    resolutionSummary: note,
  };
}