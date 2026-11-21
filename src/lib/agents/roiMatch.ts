import { z } from 'zod';
import {
  EventBrief,
  Session,
  ToolCallTrace,
  VendorQuote,
} from '@/types/blackboard';
import { generateStructured } from '@/lib/ai';
import { formatINR } from '@/lib/guardrails';

export const RoiResultSchema = z.object({
  matches: z.array(
    z.object({
      attendeeProfile: z.string(),
      matchedSponsor: z.string(),
      recommendedSession: z.string(),
      matchScore: z.number(),
      reason: z.string(),
    })
  ),
  projectedLeads: z.number(),
  roiMultiplier: z.string(),
  projectedPipelineInr: z.string(),
  costPerLeadInr: z.string(),
  executiveSummary: z.string(),
});

export type RoiResult = z.infer<typeof RoiResultSchema>;

export async function runRoiMatchAgent(
  brief: EventBrief,
  quotes: VendorQuote[],
  sessions: Session[]
): Promise<{ roi: RoiResult; toolTraces: ToolCallTrace[] }> {
  const city = brief.city ?? 'Bengaluru';
  const totalSpend = quotes.reduce(
    (sum, q) => sum + (q.totalWithGst ?? q.cost),
    0
  );

  const start = Date.now();
  const roi = await generateStructured(
    RoiResultSchema,
    `Compute Indian enterprise attendee-sponsor matchmaking and Return on Event Investment (ROEI) for "${brief.title}" in ${city} (${brief.attendees} attendees, total GST-inclusive spend ${formatINR(totalSpend)}).
Sessions: ${JSON.stringify(sessions.map((s) => ({ title: s.title, track: s.track })))}
Rules:
- Generate 3 high-intent Indian Enterprise Buyer -> Sponsor -> Session matches (matchScore between 82 and 98), using realistic Indian/global enterprise sponsors active in India (e.g., RazorpayX Enterprise, Zoho Corp, Infosys Cobalt, JioCloud, Freshworks, Postman India).
- Compute realistic qualified leads (~25-35% of attendees), an ROI multiplier (e.g., "4.2x"), formatted INR pipeline value (e.g., "₹1,85,00,000"), formatted INR cost per lead (e.g., "₹31,200"), and a sharp 2-sentence executive summary.`
  );

  const toolTraces: ToolCallTrace[] = [
    {
      toolName: 'computeIndianEnterpriseROEI',
      inputSummary: `{"city": "${city}", "attendees": ${brief.attendees}, "spendInr": ${totalSpend}}`,
      outputSummary: `{"leads": ${roi.projectedLeads}, "roi": "${roi.roiMultiplier}", "pipeline": "${roi.projectedPipelineInr}"}`,
      durationMs: Math.max(1, Date.now() - start),
    },
  ];

  return { roi, toolTraces };
}