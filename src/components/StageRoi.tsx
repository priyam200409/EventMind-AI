'use client';

import { EventBrief, Session, VendorQuote } from '@/types/blackboard';
import { RoiResult } from '@/lib/agents/roiMatch';
import { checkBudget, formatINR } from '@/lib/guardrails';
import {
  TrendingUp,
  Users,
  IndianRupee,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export function StageRoi({
  brief,
  quotes,
  sessions,
  roi,
  onReset,
}: {
  brief: EventBrief;
  quotes: VendorQuote[];
  sessions: Session[];
  roi: RoiResult;
  onReset: () => void;
}) {
  const handleDownloadReport = () => {
    const city = brief.city ?? 'Bengaluru';
    const includeGst = brief.includeGst ?? true;
    const audit = checkBudget(quotes, brief.budget, includeGst);

    const lines = [
      `# ${brief.title} — Executive Run-of-Show & GST Quotation`,
      `**Host City:** ${city} | **Delegates:** ${brief.attendees} | **Venue Format:** ${brief.venueType}`,
      '',
      '## 1. Approved Vendor Procurement & 18% GST Ledger',
      ...quotes.map(
        (q) =>
          `- **${q.category}**: ${q.vendorName} — Base: ${formatINR(q.cost)}${
            includeGst
              ? ` + GST (18%): ${formatINR(q.gstAmount ?? Math.round(q.cost * 0.18))}`
              : ''
          }`
      ),
      `- **Base Subtotal:** ${formatINR(audit.baseTotal)}`,
      includeGst
        ? `- **18% GST (9% CGST + 9% SGST):** ${formatINR(audit.gstAmount)}`
        : '- **Tax:** Excluded',
      `- **Net Payable Grand Total:** ${formatINR(audit.total)} (Budget Cap: ${formatINR(brief.budget)})`,
      '',
      '## 2. Critic-Verified IST Master Schedule',
      ...sessions.map(
        (s) =>
          `- **${s.startTime}–${s.endTime} IST** | ${s.title} (*${s.speaker}*) — ${s.room} [${s.expectedAttendance}/${s.roomCapacity}]`
      ),
      '',
      '## 3. Post-Event ROEI & Sponsor Matchmaking',
      `- **ROEI Multiplier:** ${roi.roiMultiplier}`,
      `- **Qualified Enterprise Leads:** ${roi.projectedLeads}`,
      `- **Projected Pipeline:** ${roi.projectedPipelineInr} (Cost/Lead: ${roi.costPerLeadInr})`,
      '',
      `> ${roi.executiveSummary}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brief.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-executive-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
            Stage 4 • Attribution & Executive Sign-Off
          </span>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            AI Sponsor Matchmaking & Indian ROEI Report
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <Download className="h-3.5 w-3.5" />
            Export GST & Run-of-Show
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Event
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
            <TrendingUp className="h-3.5 w-3.5" />
            ROEI Multiplier
          </div>
          <div className="mt-1 text-2xl font-extrabold text-indigo-950">
            {roi.roiMultiplier}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <Users className="h-3.5 w-3.5" />
            Qualified Leads
          </div>
          <div className="mt-1 text-2xl font-extrabold text-emerald-950">
            {roi.projectedLeads}
          </div>
        </div>

        <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700">
            <IndianRupee className="h-3.5 w-3.5" />
            Projected Pipeline
          </div>
          <div className="mt-1 text-lg font-extrabold text-sky-950">
            {roi.projectedPipelineInr}
          </div>
        </div>

        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-4">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
            <Sparkles className="h-3.5 w-3.5" />
            Cost Per Lead
          </div>
          <div className="mt-1 text-lg font-extrabold text-amber-950">
            {roi.costPerLeadInr}
          </div>
        </div>
      </div>

      <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
        {roi.executiveSummary}
      </p>

      {/* High-Intent Indian Enterprise Buyer-Sponsor Matches */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          High-Intent Enterprise Buyer ↔ Sponsor Pairings
        </h3>
        {roi.matches.map((m, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-slate-900">
              <span>
                {m.attendeeProfile} ↔ {m.matchedSponsor}
              </span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                {m.matchScore}% Intent Fit
              </span>
            </div>
            <div className="mt-1 font-medium text-indigo-600">
              Recommended Session: {m.recommendedSession}
            </div>
            <p className="mt-1.5 text-slate-600 leading-relaxed">{m.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}