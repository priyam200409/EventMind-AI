'use client';

import { RoiResult } from '@/lib/agents/roiMatch';
import { TrendingUp, Users, RotateCcw } from 'lucide-react';

export function StageRoi({ roi, onReset }: { roi: RoiResult; onReset: () => void }) {
  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">4. AI Matchmaking & Event ROI</h2>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New Event
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-indigo-50 p-4 border border-indigo-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700">
            <TrendingUp className="h-4 w-4" /> Projected ROEI Multiplier
          </div>
          <div className="mt-1 text-2xl font-bold text-indigo-950">{roi.roiMultiplier}</div>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <Users className="h-4 w-4" /> Qualified Sponsor Leads
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-950">{roi.projectedLeads}</div>
        </div>
      </div>

      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 leading-relaxed border border-slate-200">
        {roi.executiveSummary}
      </p>

      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Top AI Intent Matches</h3>
        {roi.matches.map((m, idx) => (
          <div key={idx} className="rounded-lg border border-slate-200 p-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-900">
              <span>{m.attendeeProfile} ↔ {m.matchedSponsor}</span>
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-700">{m.matchScore}% Fit</span>
            </div>
            <div className="mt-1 text-slate-600">Session: {m.recommendedSession}</div>
            <p className="mt-1 text-slate-500">{m.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}