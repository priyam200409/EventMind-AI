import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { EventBrief, VendorQuote, VendorQuoteSchema } from '@/types/blackboard';
import { VENDOR_CATALOG } from '@/lib/presets';
import { checkBudget } from '@/lib/guardrails';

export async function runProcurementAgent(brief: EventBrief): Promise<{
  quotes: VendorQuote[];
  logMessage: string;
}> {
  const { object } = await generateObject({
    model: google('gemini-3.5-flash-lite'),
    schema: z.object({ quotes: z.array(VendorQuoteSchema).length(3) }),
    prompt: `Select 1 Venue, 1 Catering, and 1 AV vendor from this catalog for "${brief.title}" (${brief.attendees} attendees, max budget $${brief.budget}).
Catalog: ${JSON.stringify(VENDOR_CATALOG)}
Compute exact catering costs (perHead * ${brief.attendees}) and ensure total cost stays under $${brief.budget}.`,
  });

  const audit = checkBudget(object.quotes, brief.budget);
  return {
    quotes: object.quotes,
    logMessage: `Selected 3 vendors totaling $${audit.total.toLocaleString()} ($${audit.remaining.toLocaleString()} under budget).`,
  };
}
