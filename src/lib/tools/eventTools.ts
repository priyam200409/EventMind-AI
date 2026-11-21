import { z } from 'zod';
import { VENDOR_CATALOG } from '@/lib/presets';
import {
  calculateGstBreakdown,
  checkBudget,
  findScheduleConflicts,
  formatINR,
} from '@/lib/guardrails';
import { DietarySplit, IndianCity, SessionSchema } from '@/types/blackboard';

export const SearchIndianVendorsInputSchema = z.object({
  city: z.enum(['Bengaluru', 'Mumbai', 'Delhi NCR', 'Hyderabad']),
  requireJainCatering: z.boolean(),
});

export function searchIndianVendorsTool(input: {
  city: IndianCity;
  requireJainCatering: boolean;
}) {
  const cityVendors = VENDOR_CATALOG.filter((v) => v.city === input.city);
  const filtered = cityVendors.filter((v) => {
    if (v.category === 'Catering' && input.requireJainCatering) {
      return v.jainCertified === true;
    }
    return true;
  });

  return {
    city: input.city,
    jainFilterApplied: input.requireJainCatering,
    vendors: filtered.length > 0 ? filtered : cityVendors,
  };
}

export const CalculateCateringAndGstInputSchema = z.object({
  attendees: z.number(),
  venueCostInr: z.number(),
  cateringPerHeadInr: z.number(),
  avCostInr: z.number(),
  maxBudgetInr: z.number(),
  includeGst: z.boolean(),
  dietarySplit: z.object({
    vegPct: z.number(),
    jainPct: z.number(),
    nonVegPct: z.number(),
  }),
});

export function calculateCateringAndGstTool(input: {
  attendees: number;
  venueCostInr: number;
  cateringPerHeadInr: number;
  avCostInr: number;
  maxBudgetInr: number;
  includeGst: boolean;
  dietarySplit: DietarySplit;
}) {
  const cateringBase = input.attendees * input.cateringPerHeadInr;
  const vegPlates = Math.round((input.attendees * input.dietarySplit.vegPct) / 100);
  const jainPlates = Math.round((input.attendees * input.dietarySplit.jainPct) / 100);
  const nonVegPlates = Math.max(0, input.attendees - vegPlates - jainPlates);

  const mockQuotes = [
    { category: 'Venue' as const, vendorName: 'Selected Venue', cost: input.venueCostInr, rationale: '' },
    { category: 'Catering' as const, vendorName: 'Selected Catering', cost: cateringBase, rationale: '' },
    { category: 'AV & Production' as const, vendorName: 'Selected AV', cost: input.avCostInr, rationale: '' },
  ];

  const audit = checkBudget(mockQuotes, input.maxBudgetInr, input.includeGst);
  const venueTax = calculateGstBreakdown(input.venueCostInr);
  const cateringTax = calculateGstBreakdown(cateringBase);
  const avTax = calculateGstBreakdown(input.avCostInr);

  return {
    cateringBaseInr: cateringBase,
    plateBreakdown: { vegPlates, jainPlates, nonVegPlates },
    itemizedGst: {
      venueGst: venueTax.gstAmount,
      cateringGst: cateringTax.gstAmount,
      avGst: avTax.gstAmount,
    },
    baseTotalFormatted: formatINR(audit.baseTotal),
    gstTotalFormatted: formatINR(audit.gstAmount),
    grandTotalWithGst: audit.total,
    grandTotalFormatted: formatINR(audit.total),
    withinBudget: audit.withinBudget,
    utilizationPct: audit.utilizationPct,
    requiresHitlApproval: audit.requiresHitlApproval,
  };
}

export const AuditScheduleInputSchema = z.object({
  sessions: z.array(SessionSchema),
});

export function auditScheduleConflictsTool(input: {
  sessions: z.infer<typeof SessionSchema>[];
}) {
  const conflicts = findScheduleConflicts(input.sessions);
  return {
    status: conflicts.length === 0 ? 'CLEAN' : 'CONFLICTS_FOUND',
    conflictCount: conflicts.length,
    conflicts,
  };
}

export const DispatchWhatsAppAlertInputSchema = z.object({
  city: z.string(),
  affectedSessionTitle: z.string(),
  newRoomOrTime: z.string(),
  impactedAttendees: z.number(),
  shortMessage: z.string(),
});

export function dispatchWhatsAppAlertTool(input: {
  city: string;
  affectedSessionTitle: string;
  newRoomOrTime: string;
  impactedAttendees: number;
  shortMessage: string;
}) {
  const requiresHitlApproval = input.impactedAttendees >= 250;
  return {
    channel: 'WhatsApp Business API + SMS Fallback',
    city: input.city,
    deliveryStatus: requiresHitlApproval ? 'QUEUED_FOR_OPS_APPROVAL' : 'DISPATCHED',
    impactedAttendees: input.impactedAttendees,
    requiresHitlApproval,
    formattedBroadcast: `[EventMind Ops • ${input.city}] ${input.shortMessage} (${input.affectedSessionTitle} → ${input.newRoomOrTime})`,
  };
}