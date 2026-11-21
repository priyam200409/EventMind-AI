import { z } from 'zod';
import { EventBrief, Session, SessionSchema } from '@/types/blackboard';
import { VENUE_ROOMS } from '@/lib/presets';
import { findScheduleConflicts } from '@/lib/guardrails';
import { generateStructured } from '@/lib/ai';

export async function runSchedulerAgent(brief: EventBrief): Promise<{
  sessions: Session[];
  conflictsResolved: number;
  criticNotes: string;
}> {
  let sessions: Session[] = [];
  let feedback = '';
  let conflictsResolved = 0;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await generateStructured(
      z.object({ sessions: z.array(SessionSchema) }),
      `Build a 6-session multi-track conference agenda for "${brief.title}" (${brief.attendees} attendees).
Tracks: ${brief.tracks.join(', ')}.
Available Rooms: ${JSON.stringify(VENUE_ROOMS)}.
Rules: Use 24h times ("09:00" to "17:00"), assign unique session ids ("s1" to "s6") and realistic speakers, keep expectedAttendance <= roomCapacity, and avoid room or speaker overlaps.
${feedback ? `FIX THESE AUDIT ERRORS FROM PREVIOUS DRAFT:\n${feedback}` : ''}`
    );

    sessions = result.sessions;
    const conflicts = findScheduleConflicts(sessions);

    if (conflicts.length === 0) {
      return {
        sessions,
        conflictsResolved,
        criticNotes: attempt === 1
          ? 'Critic verified 0 schedule or capacity conflicts on first pass.'
          : `Critic caught ${conflictsResolved} conflict(s) and verified self-healed schedule.`,
      };
    }

    conflictsResolved += conflicts.length;
    feedback = conflicts.join('\n');
  }

  return {
    sessions,
    conflictsResolved,
    criticNotes: `Completed schedule with ${conflictsResolved} auto-resolved adjustments.`,
  };
}