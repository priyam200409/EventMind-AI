'use client';

import { motion } from 'framer-motion';
import { ApprovalGate, Session, VendorQuote } from '@/types/blackboard';
import { checkBudget, formatINR } from '@/lib/guardrails';
import { CheckCircle2, ArrowRight, ShieldAlert, Check, X, CalendarClock } from 'lucide-react';

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
  const gstRate = includeGst ? 0.18 : 0;

  return (
    <div className="space-y-5">
      {approvalGate && (
        <div
          className={`rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            approvalGate.status === 'approved'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
              : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <ShieldAlert
              className={`h-5 w-5 shrink-0 mt-0.5 ${
                approvalGate.status === 'approved'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                HITL Approval ({approvalGate.agent}) • {approvalGate.status.toUpperCase()}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{approvalGate.reason}</p>
            </div>
          </div>

          {approvalGate.status === 'pending' && onApproveGate && onRejectGate && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onApproveGate(approvalGate.id)}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 transition"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => onRejectGate(approvalGate.id)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold px-3.5 py-2 transition"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}
        </div>
      )}

      {/* Procurement & GST Ledger */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1324] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Procurement & Tax Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified vendor allocations and Indian GST computation.
            </p>
          </div>
          <span
            className={`rounded-full px-3.5 py-1.5 text-xs font-mono font-bold border ${
              audit.withinBudget
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25'
            }`}
          >
            Total: {formatINR(audit.total)}
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          {quotes.map((q, idx) => {
            const itemGst = q.gstAmount ?? Math.round(q.cost * gstRate);
            return (
              <div
                key={`${q.category}-${idx}`}
                className="rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-4 flex flex-col justify-between"
              >
                <div>
                  <span className="inline-block rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2">
                    {q.category}
                  </span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {q.vendorName}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {q.rationale}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                  <div className="text-base font-mono font-extrabold text-slate-900 dark:text-white">
                    {formatINR(q.cost)}
                  </div>
                  <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {includeGst ? `+ ${formatINR(itemGst)} GST (18%)` : 'GST Excluded'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl bg-slate-100/90 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-slate-700 dark:text-slate-300">
            Base: <strong>{formatINR(audit.baseTotal)}</strong>
          </span>
          {includeGst && (
            <>
              <span className="text-slate-700 dark:text-slate-300">
                CGST (9%): <strong>{formatINR(audit.cgst)}</strong>
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                SGST (9%): <strong>{formatINR(audit.sgst)}</strong>
              </span>
            </>
          )}
          <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
            Net Payable: {formatINR(audit.total)}
          </span>
        </div>
      </div>

      {/* Verified Agenda */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1324] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Verified IST Schedule
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-3 py-1 text-xs font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />0 Clashes ({conflictsResolved} resolved)
          </span>
        </div>

        <div className="space-y-2.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 px-4 py-3"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <span className="rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 px-2.5 py-1 font-mono text-xs font-bold shrink-0">
                  {s.startTime}–{s.endTime}
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {s.speaker} • <span className="text-indigo-600 dark:text-indigo-400">{s.track}</span>
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{s.room}</div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {s.expectedAttendance}/{s.roomCapacity} delegates
                </div>
              </div>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.008 }}
          whileTap={{ scale: 0.985 }}
          type="button"
          onClick={onNext}
          className="mt-6 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm py-3.5 px-6 shadow-lg shadow-indigo-600/20 transition-all"
        >
          Proceed to Live Ops <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}