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
          className={`rounded-2xl border p-4 shadow-sm ${
            approvalGate.status === 'approved'
              ? 'border-emerald-200 bg-emerald-50/70'
              : approvalGate.status === 'rejected'
              ? 'border-rose-200 bg-rose-50/70'
              : 'border-amber-300 bg-amber-50'
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert
                className={`mt-0.5 h-5 w-5 shrink-0 ${
                  approvalGate.status === 'approved'
                    ? 'text-emerald-600'
                    : approvalGate.status === 'rejected'
                    ? 'text-rose-600'
                    : 'text-amber-600'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-900">
                    Human-in-the-Loop (HITL) Governance Gate
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700 border border-slate-200">
                    {approvalGate.status}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-800">
                  {approvalGate.reason}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">
                  {approvalGate.impactSummary}
                </p>
              </div>
            </div>

            {approvalGate.status === 'pending' && onApproveGate && onRejectGate && (
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onApproveGate(approvalGate.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve PO
                </button>
                <button
                  type="button"
                  onClick={() => onRejectGate(approvalGate.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              2A. Autonomous Vendor Procurement (INR)
            </h2>
            <p className="text-xs text-slate-500">
              Verified against city vendor catalog, dietary compliance & 18% GST policy.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              audit.withinBudget
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            Grand Total: {formatINR(audit.total)} ({audit.utilizationPct}% of cap)
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {quotes.map((q, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col justify-between"
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                  {q.category}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {q.vendorName}
                </div>
                <div className="mt-2 text-lg font-extrabold text-slate-900">
                  {formatINR(q.cost)}
                </div>
                {includeGst && (
                  <div className="text-[11px] text-slate-500">
                    + {formatINR(q.gstAmount ?? Math.round(q.cost * 0.18))} GST (18%)
                  </div>
                )}
              </div>
              <p className="mt-2.5 border-t border-slate-200/80 pt-2 text-xs text-slate-600">
                {q.rationale}
              </p>
            </div>
          ))}
        </div>

        {/* Itemized Indian GST Tax Ledger */}
        <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 text-xs text-slate-200">
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
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              2B. Multi-Track Master Agenda (IST)
            </h2>
            <p className="text-xs text-slate-500">
              Mathematically verified for room capacity and speaker zero-overlap.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            0 Conflicts Verified ({conflictsResolved} auto-healed)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2.5 font-semibold">IST Time</th>
                <th className="px-3 py-2.5 font-semibold">Session & Speaker</th>
                <th className="px-3 py-2.5 font-semibold">Track</th>
                <th className="px-3 py-2.5 font-semibold">Hall & Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70">
                  <td className="px-3 py-3 font-mono font-semibold text-slate-700">
                    {s.startTime}–{s.endTime}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-900">{s.title}</div>
                    <div className="text-slate-500">{s.speaker}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                      {s.track}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-slate-600">
                    {s.room}{' '}
                    <span className="font-mono text-[11px] text-slate-500">
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
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            Proceed to Live Event Ops
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}