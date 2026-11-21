import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { EventBrief, Session, VendorQuote } from '@/types/blackboard';

export const RoiResultSchema = z.object({
  matches: z.array(z.object({
    attendeeProfile: z.string(),
    matchedSponsor: z.string(),
    recommendedSession: z.string(),
    matchScore: z.number().min(75).max(99),
    reason: z.string(),
  })).length(3),
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

  const { object } = await generateObject({
    model: google('gemini-3.5-flash-lite'),
    schema: RoiResultSchema,
    prompt: `Compute attendee-sponsor matchmaking and ROEI for "${brief.title}" (${brief.attendees} attendees, total spend $${totalSpend}).
Sessions: ${JSON.stringify(sessions.map((s) => ({ title: s.title, track: s.track })))}
Generate 3 high-intent Enterprise Attendee -> Sponsor -> Session matches, realistic qualified leads, an ROI multiplier (e.g., "3.4x"), and a 2-sentence executive ROI summary.`,
  });

  return object;
}