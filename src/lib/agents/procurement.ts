import { z } from 'zod';
import {
  ApprovalGate,
  EventBrief,
  ToolCallTrace,
  VendorQuote,
  VendorQuoteSchema,
} from '@/types/blackboard';
import { calculateGstBreakdown, checkBudget, formatINR } from '@/lib/guardrails';
import { runReActToolAgent } from '@/lib/ai';
import {
  CalculateCateringAndGstInputSchema,
  calculateCateringAndGstTool,
  SearchIndianVendorsInputSchema,
  searchIndianVendorsTool,
} from '@/lib/tools/eventTools';

export async function runProcurementAgent(brief: EventBrief): Promise<{
  quotes: VendorQuote[];
  gstSummary: ReturnType<typeof checkBudget>;
  approvalGate: ApprovalGate | null;
  toolTraces: ToolCallTrace[];
  logMessage: string;
}> {
  const city = brief.city ?? 'Bengaluru';
  const includeGst = brief.includeGst ?? true;
  const dietarySplit = brief.dietarySplit ?? { vegPct: 55, jainPct: 15, nonVegPct: 30 };

  const { result, traces } = await runReActToolAgent({
    systemPrompt: `You are an autonomous Indian Enterprise Procurement Agent. You must discover city-specific vendors and verify exact INR costs including 18% GST before finalizing quotes.`,
    userPrompt: `Procure 1 Venue, 1 Catering partner, and 1 AV & Production partner for "${brief.title}" in ${city}.
Attendees: ${brief.attendees}.
Max Total Budget (including 18% GST): ${formatINR(brief.budget)} (${brief.budget} INR).
Dietary Split: ${dietarySplit.vegPct}% Veg, ${dietarySplit.jainPct}% Jain, ${dietarySplit.nonVegPct}% Non-Veg.
Step 1: Call "searchIndianVendors" for ${city} (set requireJainCatering to ${dietarySplit.jainPct > 0}).
Step 2: Call "calculateCateringAndGst" with your chosen vendor base costs to verify exact 18% GST totals and dietary plate counts.
Step 3: Return exactly 3 VendorQuote items with exact base INR "cost" (for Catering, cost = perHead * ${brief.attendees}).`,
    tools: {
      searchIndianVendors: {
        description:
          'Searches Indian metro venue, catering, and AV catalogs by city and Jain kitchen certification. Args: {"city": "Bengaluru"|"Mumbai"|"Delhi NCR"|"Hyderabad", "requireJainCatering": boolean}',
        inputSchema: SearchIndianVendorsInputSchema,
        execute: (args) => searchIndianVendorsTool(args),
      },
      calculateCateringAndGst: {
        description:
          'Calculates exact INR catering totals, Veg/Jain/Non-Veg plate counts, 18% GST (CGST+SGST), and budget compliance. Args: {"attendees": number, "venueCostInr": number, "cateringPerHeadInr": number, "avCostInr": number, "maxBudgetInr": number, "includeGst": boolean, "dietarySplit": {"vegPct": number, "jainPct": number, "nonVegPct": number}}',
        inputSchema: CalculateCateringAndGstInputSchema,
        execute: (args) => calculateCateringAndGstTool(args),
      },
    },
    outputSchema: z.object({
      quotes: z.array(VendorQuoteSchema),
    }),
  });

  const enrichedQuotes: VendorQuote[] = result.quotes.map((q) => {
    const tax = includeGst
      ? calculateGstBreakdown(q.cost)
      : { gstAmount: 0, totalWithGst: q.cost };
    return {
      ...q,
      gstAmount: tax.gstAmount,
      totalWithGst: tax.totalWithGst,
    };
  });

  const gstSummary = checkBudget(enrichedQuotes, brief.budget, includeGst);

  const approvalGate: ApprovalGate | null = gstSummary.requiresHitlApproval
    ? {
        id: `hitl-proc-${Date.now()}`,
        agent: 'Procurement',
        reason: !gstSummary.withinBudget
          ? `Grand total with 18% GST (${formatINR(gstSummary.total)}) exceeds budget cap (${formatINR(brief.budget)}).`
          : `High-value enterprise commitment (${gstSummary.utilizationPct}% budget utilization / single vendor ≥ ₹20,00,000).`,
        impactSummary: `Base: ${formatINR(gstSummary.baseTotal)} + 18% GST: ${formatINR(gstSummary.gstAmount)} = ${formatINR(gstSummary.total)}`,
        status: 'pending',
      }
    : null;

  return {
    quotes: enrichedQuotes,
    gstSummary,
    approvalGate,
    toolTraces: traces,
    logMessage: `Executed ${traces.length} tool(s) for ${city}: Base ${formatINR(gstSummary.baseTotal)} + 18% GST ${formatINR(gstSummary.gstAmount)} = ${formatINR(gstSummary.total)} (${gstSummary.withinBudget ? `${formatINR(gstSummary.remaining)} remaining` : 'HITL approval required'}).`,
  };
}