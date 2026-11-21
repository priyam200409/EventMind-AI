'use client';

import { ApprovalGate, Session, VendorQuote } from '@/types/blackboard';
import { checkBudget, formatINR } from '@/lib/guardrails';
import {
  CheckCircle2,
  ArrowRight,
  Receipt,
  ShieldAlert,
  Check,
  X,
} from 'lucide-react';

export function StagePlan({
  quotes,
  sessions,
  conflictsResolved,
  budget = 4500000,
  includeGst = true,
  approvalGate,
  onApproveGate,
  onRejectGate,
  onNext,
}: {
  quotes: VendorQuote[];
  sessions: Session[];
  conflictsResolved: number;
  budget?: number;
  includeGst?: boolean;
  approvalGate?: ApprovalGate | null;
  onApproveGate?: (id: string) => void;
  onRejectGate?: (id: string) => void;
  onNext: () => void;
}) {
  const audit = checkBudget(quotes, budget, includeGst);

  return (
    <div className="space-y-6">
      {/* Human-in-the-Loop (HITL) Governance Gate */}
      {approvalGate && (
        <div
          className={`rounded-2xl border p-4 shadow-sm transition-colors ${
            approvalGate.status === 'approved'
              ? 'border-emerald-300 bg-emerald-50/80 dark:border-emerald-500/30 dark:bg-emerald-500/10'
              : approvalGate.status === 'rejected'
              ? 'border-rose-300 bg-rose-50/80 dark:border-rose-500/30 dark:bg-rose-500/10'
              : 'border-amber-300 bg-amber-50/90 dark:border-amber-500/40 dark:bg-amber-500/10'
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  approvalGate.status === 'approved'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : approvalGate.status === 'rejected'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-900 dark:text-white">
                    Human-in-the-Loop (HITL) Governance Gate
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {approvalGate.status}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-800 dark:text-slate-200">
                  {approvalGate.reason}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  {approvalGate.impactSummary}
                </p>
              </div>
            </div>

            {approvalGate.status === 'pending' && onApproveGate && onRejectGate && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onApproveGate(approvalGate.id)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-500"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve PO
                </button>
                <button
                  type="button"
                  onClick={() => onRejectGate(approvalGate.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <X className="h-3.5 w-3.5" />
                  Flag Revision
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2A. Procurement & 18% GST Compliance Card */}
      <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-[#111827]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              2A. Autonomous Vendor Procurement (INR)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified against city vendor catalog, dietary compliance & 18% GST policy.
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 font-mono text-xs font-bold ${
              audit.withinBudget
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300'
            }`}
          >
            Total: {formatINR(audit.total)} ({audit.utilizationPct}%)
          </span>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          {quotes.map((q, i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-indigo-500/40"
            >
              <div>
                <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {q.category}
                </span>
                <div className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  {q.vendorName}
                </div>
                <div className="mt-2 font-mono text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {formatINR(q.cost)}
                </div>
                {includeGst && (
                  <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    + {formatINR(q.gstAmount ?? Math.round(q.cost * 0.18))} GST (18%)
                  </div>
                )}
              </div>
              <p className="mt-3 border-t border-slate-200/80 pt-2.5 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-400">
                {q.rationale}
              </p>
            </div>
          ))}
        </div>

        {/* Itemized Indian GST Tax Ledger */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-semibold text-white">
              <Receipt className="h-4 w-4 text-indigo-400" />
              <span>Indian Enterprise Tax & Budget Ledger</span>
            </div>
            <div className="flex flex-wrap gap-4 font-mono text-[11px]">
              <span>Base: {formatINR(audit.baseTotal)}</span>
              {includeGst && (
                <>
                  <span className="text-slate-400">
                    CGST (9%): {formatINR(audit.cgst)}
                  </span>
                  <span className="text-slate-400">
                    SGST (9%): {formatINR(audit.sgst)}
                  </span>
                </>
              )}
              <span className="font-bold text-emerald-400">
                Net Payable: {formatINR(audit.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2B. Critic-Audited IST Master Agenda */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-[#111827]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              2B. Multi-Track Master Agenda (IST)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mathematically verified for room capacity and speaker zero-overlap.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            0 Conflicts Verified ({conflictsResolved} auto-healed)
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-400">
              <tr>
                <th className="px-3.5 py-3 font-semibold">IST Time</th>
                <th className="px-3.5 py-3 font-semibold">Session & Speaker</th>
                <th className="px-3.5 py-3 font-semibold">Track</th>
                <th className="px-3.5 py-3 font-semibold">Hall & Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {sessions.map((s) => (
                <tr
                  key={s.id}
                  className="transition hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                >
                  <td className="px-3.5 py-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {s.startTime}–{s.endTime}
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {s.title}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {s.speaker}
                    </div>
                  </td>
                  <td className="px-3.5 py-3">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                      {s.track}
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-slate-600 dark:text-slate-300">
                    {s.room}{' '}
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      ({s.expectedAttendance}/{s.roomCapacity})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500"
          >
            Proceed to Live Event Ops
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}