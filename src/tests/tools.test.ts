import { describe, it, expect } from 'vitest';
import {
  calculateCateringAndGstTool,
  searchIndianVendorsTool,
} from '@/lib/tools/eventTools';

describe('Executable Indian Event Tools', () => {
  it('filters Mumbai caterers by Jain kitchen certification', () => {
    const res = searchIndianVendorsTool({
      city: 'Mumbai',
      requireJainCatering: true,
    });
    const caterers = res.vendors.filter((v) => v.category === 'Catering');
    expect(caterers.length).toBe(1);
    expect(caterers[0].jainCertified).toBe(true);
  });

  it('computes dietary plate splits and 18% GST grand total accurately', () => {
    const res = calculateCateringAndGstTool({
      attendees: 400,
      venueCostInr: 1200000,
      cateringPerHeadInr: 1500, // 400 * 1500 = 600,000
      avCostInr: 500000,
      maxBudgetInr: 3000000,
      includeGst: true,
      dietarySplit: { vegPct: 50, jainPct: 25, nonVegPct: 25 },
    });

    // Base = 12L + 6L + 5L = 23,00,000; 18% GST = 4,14,000; Grand Total = 27,14,000
    expect(res.plateBreakdown).toEqual({
      vegPlates: 200,
      jainPlates: 100,
      nonVegPlates: 100,
    });
    expect(res.grandTotalWithGst).toBe(2714000);
    expect(res.withinBudget).toBe(true);
  });
});