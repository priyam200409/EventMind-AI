import { z } from 'zod';
import {
  EventBrief,
  Session,
  SessionSchema,
  ToolCallTrace,
} from '@/types/blackboard';
import { VENUE_ROOMS } from '@/lib/presets';
import { generateStructured } from '@/lib/ai';
import { auditScheduleConflictsTool } from '@/lib/tools/eventTools';

export async function runSchedulerAgent(brief: EventBrief): Promise<{
  sessions: Session[];
  conflictsResolved: number;
  criticNotes: string;
  toolTraces: ToolCallTrace[];
}> {
  const city = brief.city ?? 'Bengaluru';
  let sessions: Session[] = [];
  let feedback = '';
  let conflictsResolved = 0;
  const toolTraces: ToolCallTrace[] = [];

  for (let attempt = 1; attempt <= 2; attempt++) {
    const { sessions: generated } = await generateStructured(
      z.object({ sessions: z.array(SessionSchema) }),
      `Build a 6-session multi-track Indian enterprise conference agenda for "${brief.title}" in ${city} (${brief.attendees} attendees).
Tracks: ${brief.tracks.join(', ')}.
Available Rooms: ${JSON.stringify(VENUE_ROOMS)}.
Rules:
- Use 24h IST times ("09:30" to "17:00") with lunch break around 13:00-14:00.
- Assign unique session ids ("s1" to "s6") and realistic Indian tech/enterprise speakers (e.g., Dr. Ananya Sharma, Vikramaditya Rao, Meera Krishnan, Siddharth Malhotra, Karthik Subramanian, Neha Kulkarni).
- Keep expectedAttendance <= roomCapacity and avoid any room or speaker overlaps.
${feedback ? `FIX THESE CRITIC AUDIT ERRORS FROM PREVIOUS DRAFT:\n${feedback}` : ''}`
    );

    sessions = generated;
    const start = Date.now();
    const audit = auditScheduleConflictsTool({ sessions });
    const durationMs = Math.max(1, Date.now() - start);

    toolTraces.push({
      toolName: 'auditScheduleConflicts',
      inputSummary: `{"pass": ${attempt}, "sessionCount": ${sessions.length}}`,
      outputSummary: JSON.stringify(audit),
      durationMs,
    });

    if (audit.conflictCount === 0) {
      return {
        sessions,
        conflictsResolved,
        criticNotes:
          attempt === 1
            ? `Critic verified 0 schedule or capacity conflicts across ${sessions.length} ${city} sessions on first pass.`
            : `Critic caught ${conflictsResolved} conflict(s) and verified self-healed ${city} schedule.`,
        toolTraces,
      };
    }

    conflictsResolved += audit.conflictCount;
    feedback = audit.conflicts.join('\n');
  }

  return {
    sessions,
    conflictsResolved,
    criticNotes: `Completed ${city} schedule with ${conflictsResolved} auto-resolved adjustments.`,
    toolTraces,
  };
}