'use client';

import { Session, VendorQuote } from '@/types/blackboard';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export function StagePlan({
  quotes,
  sessions,
  conflictsResolved,
  onNext,
}: {
  quotes: VendorQuote[];
  sessions: Session[];
  conflictsResolved: number;
  onNext: () => void;
}) {
  const totalSpend = quotes.reduce((sum, q) => sum + q.cost, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">2A. Autonomous Vendor Procurement</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Total: ${totalSpend.toLocaleString()}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {quotes.map((q, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs font-semibold text-indigo-600">{q.category}</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{q.vendorName}</div>
              <div className="mt-1 text-base font-bold text-slate-800">${q.cost.toLocaleString()}</div>
              <p className="mt-1 text-xs text-slate-500">{q.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-900">2B. Multi-Track Master Agenda</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            0 Conflicts Verified ({conflictsResolved} auto-healed)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="py-2">Time</th>
                <th className="py-2">Session & Speaker</th>
                <th className="py-2">Track</th>
                <th className="py-2">Room (Load)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 font-medium text-slate-700">{s.startTime}–{s.endTime}</td>
                  <td className="py-2.5">
                    <div className="font-semibold text-slate-900">{s.title}</div>
                    <div className="text-slate-500">{s.speaker}</div>
                  </td>
                  <td className="py-2.5 text-indigo-600 font-medium">{s.track}</td>
                  <td className="py-2.5 text-slate-600">
                    {s.room} ({s.expectedAttendance}/{s.roomCapacity})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Proceed to Live Event Ops
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}