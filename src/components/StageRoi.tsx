'use client';

import { EventBrief, Session, VendorQuote } from '@/types/blackboard';
import { RoiResult } from '@/lib/agents/roiMatch';
import { checkBudget, formatINR } from '@/lib/guardrails';
import { TrendingUp, Users, Wallet, Target, Download, Sparkles, RotateCcw } from 'lucide-react';

export function StageRoi({
  brief,
  quotes,
  sessions,
  roi,
  onReset
}: {
  brief: EventBrief;
  quotes: VendorQuote[];
  sessions: Session[];
  roi: RoiResult;
  onReset: () => void;
}) {
  const handleDownload = () => {
    const audit = checkBudget(quotes, brief.budget, brief.includeGst ?? true);
    const md = [
      `# ${brief.title} — Executive Run-of-Show`,
      `**City:** ${brief.city} | **Pax:** ${brief.attendees} | **Format:** ${brief.venueType}`,
      `\n## 1. Approved 18% GST Ledger`,
      ...quotes.map((q: VendorQuote) => `- **${q.category}**: ${q.vendorName} — Base: ${formatINR(q.cost)}`),
      `- **Grand Total (with GST):** ${formatINR(audit.total)} (Cap: ${formatINR(brief.budget)})`,
      `\n## 2. Verified IST Master Schedule`,
      ...sessions.map((s: Session) => `- **${s.startTime}-${s.endTime}** | ${s.title} (${s.room})`),
      `\n## 3. ROEI & Pipeline Generation`,
      `- **ROEI Multiplier:** ${roi.roiMultiplier}`,
      `- **Qualified Leads:** ${roi.projectedLeads}`,
      `- **Projected Pipeline:** ${roi.projectedPipelineInr}`,
      `\n> ${roi.executiveSummary}`
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${brief.city}-Executive-Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-enter">
      <div className="glass-panel rounded-2xl p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Executive Analytics &amp; ROEI</h2>
            <p className="text-sm text-slate-400">
              AI-driven matchmaking and pipeline attribution based on local {brief.city} enterprise data.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
            >
              <Download className="h-4 w-4" /> Export Markdown
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> Restart
            </button>
          </div>
        </div>

        {/* Gradient KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="animate-enter delay-100 bg-black/40 border border-white/5 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5"><TrendingUp className="h-24 w-24" /></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2">ROEI Multiplier</div>
            <div className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {roi.roiMultiplier}
            </div>
          </div>

          <div className="animate-enter delay-200 bg-black/40 border border-white/5 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5"><Users className="h-24 w-24" /></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2">Qualified Leads</div>
            <div className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {roi.projectedLeads}
            </div>
          </div>

          <div className="animate-enter delay-300 bg-black/40 border border-white/5 rounded-xl p-5 relative overflow-hidden col-span-2 sm:col-span-1">
            <div className="absolute -right-4 -top-4 opacity-5"><Wallet className="h-24 w-24" /></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2">Pipeline Gen</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
              {roi.projectedPipelineInr}
            </div>
          </div>

          <div className="animate-enter delay-300 bg-black/40 border border-white/5 rounded-xl p-5 relative overflow-hidden col-span-2 sm:col-span-1">
            <div className="absolute -right-4 -top-4 opacity-5"><Target className="h-24 w-24" /></div>
            <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2">Cost Per Lead</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-1">
              {roi.costPerLeadInr}
            </div>
          </div>
        </div>

        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-100 leading-relaxed mb-8 flex gap-3 items-start">
          <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          {roi.executiveSummary}
        </div>

        {/* Intent Matchmaking Rows */}
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">High-Intent B2B Matchmaking</h3>
        <div className="space-y-3">
          {roi.matches.map((m: RoiResult['matches'][number], idx: number) => (
            <div key={idx} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="font-semibold text-white">
                  {m.attendeeProfile} <span className="text-slate-500 mx-2">↔</span> {m.matchedSponsor}
                </div>
                <div className="px-2 py-1 bg-white/10 text-white text-[10px] font-mono rounded font-bold">
                  {m.matchScore}% Match
                </div>
              </div>
              <div className="text-xs text-indigo-400 font-medium mb-1">Via: {m.recommendedSession}</div>
              <div className="text-xs text-slate-400">{m.reason}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}