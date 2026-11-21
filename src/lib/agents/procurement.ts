import { z } from 'zod';
import { EventBrief, VendorQuote, VendorQuoteSchema } from '@/types/blackboard';
import { VENDOR_CATALOG } from '@/lib/presets';
import { checkBudget } from '@/lib/guardrails';
import { generateStructured } from '@/lib/ai';

export async function runProcurementAgent(brief: EventBrief): Promise<{
  quotes: VendorQuote[];
  logMessage: string;
}> {
  const { quotes } = await generateStructured(
    z.object({ quotes: z.array(VendorQuoteSchema) }),
    `Select exactly 3 vendors (1 Venue, 1 Catering, and 1 AV & Production) from this catalog for "${brief.title}" (${brief.attendees} attendees, max budget $${brief.budget}).
Catalog: ${JSON.stringify(VENDOR_CATALOG)}
Compute exact catering costs (perHead * ${brief.attendees}) and ensure total cost stays under $${brief.budget}.`
  );

  const audit = checkBudget(quotes, brief.budget);
  return {
    quotes,
    logMessage: `Selected ${quotes.length} vendors totaling $${audit.total.toLocaleString()} ($${audit.remaining.toLocaleString()} under budget).`,
  };
}