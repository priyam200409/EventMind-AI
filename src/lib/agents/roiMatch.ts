import { z } from 'zod';
import { EventBrief, Session, VendorQuote } from '@/types/blackboard';
import { generateStructured } from '@/lib/ai';

export const RoiResultSchema = z.object({
  matches: z.array(z.object({
    attendeeProfile: z.string(),
    matchedSponsor: z.string(),
    recommendedSession: z.string(),
    matchScore: z.number(),
    reason: z.string(),
  })),
  projectedLeads: z.number(),
  roiMultiplier: z.string(),
  executiveSummary: z.string(),
});

export type RoiResult = z.infer<typeof RoiResultSchema>;

export async function runRoiMatchAgent(
  brief: EventBrief,
  quotes: VendorQuote[],
  sessions: Session[]
): Promise<RoiResult> {
  const totalSpend = quotes.reduce((sum, q) => sum + q.cost, 0);

  return generateStructured(
    RoiResultSchema,
    `Compute attendee-sponsor matchmaking and ROEI for "${brief.title}" (${brief.attendees} attendees, total spend $${totalSpend}).
Sessions: ${JSON.stringify(sessions.map((s) => ({ title: s.title, track: s.track })))}
Generate 3 high-intent Enterprise Attendee -> Sponsor -> Session matches (matchScore between 80 and 98), realistic qualified leads, an ROI multiplier (e.g., "3.4x"), and a 2-sentence executive ROI summary.`
  );
}