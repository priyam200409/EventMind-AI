'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ApprovalGate, Session } from '@/types/blackboard';
import {
  AlertTriangle,
  Check,
  X,
  Copy,
  ExternalLink,
  ShieldAlert,
  Send,
  ArrowRight,
  Clock,
} from 'lucide-react';

const CRISIS_PRESETS = [
  'Keynote speaker delayed by 30 mins due to airport traffic',
  'Main Plenary Hall overcapacity (110 extra delegates arrived)',
  'LED wall & primary mic failure in Main Hall — shift to Studio A',
];

export function StageLiveOps({
  city = 'Bengaluru',
  sessions,
  alertMessage,
  whatsappBroadcast,
  approvalGate,
  loading,
  onApproveGate,
  onRejectGate,
  onTriggerCrisis,
  onComputeRoi,
}: {
  city?: string;
  sessions: Session[];
  alertMessage?: string;
  whatsappBroadcast?: string;
  approvalGate?: ApprovalGate | null;
  loading: boolean;
  onApproveGate: (id: string) => void;
  onRejectGate: (id: string) => void;
  onTriggerCrisis: (crisis: string) => void;
  onComputeRoi: () => void;
}) {
  const [customCrisis, setCustomCrisis] = useState(CRISIS_PRESETS[0]);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [copied, setCopied] = useState(false);

  const isGatePending = approvalGate?.status === 'pending';
  const isGateApproved = !approvalGate || approvalGate.status === 'approved';

  const buildWhatsAppUrl = () => {
    const text = encodeURIComponent(whatsappBroadcast || '');
    const digitsOnly = recipientPhone.replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      const normalized = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
      return `https://wa.me/${normalized}?text=${text}`;
    }
    return `https://wa.me/?text=${text}`;
  };

  const handleCopy = async () => {
    if (!whatsappBroadcast) return;
    try {
      await navigator.clipboard.writeText(whatsappBroadcast);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors in restricted contexts
    }
  };

  return (
    <div className="space-y-5">
      {/* Crisis Trigger Panel */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                LiveOps Incident & WhatsApp Responder ({city})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simulate an event emergency—the agent re-routes sessions and drafts a guest WhatsApp broadcast.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {CRISIS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              disabled={loading}
              onClick={() => {
                setCustomCrisis(preset);
                onTriggerCrisis(preset);
              }}
              className="text-left rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-amber-500/10 hover:border-amber-500/30 border border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition disabled:opacity-50"
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            value={customCrisis}
            onChange={(e) => setCustomCrisis(e.target.value)}
            placeholder="Describe a live emergency..."
            className="premium-input flex-1"
          />
          <button
            type="button"
            disabled={loading || !customCrisis.trim()}
            onClick={() => onTriggerCrisis(customCrisis)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm px-5 py-3 shadow-md shadow-amber-600/20 transition disabled:opacity-50 shrink-0"
          >
            <Send className="h-4 w-4" />
            {loading ? 'Mitigating...' : 'Run LiveOps Agent'}
          </button>
        </div>
      </div>

      {/* Human-in-the-Loop Approval Gate */}
      {approvalGate && (
        <div
          className={`rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            approvalGate.status === 'approved'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
              : approvalGate.status === 'rejected'
              ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'
              : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Manager Approval ({approvalGate.agent}) • {approvalGate.status.toUpperCase()}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{approvalGate.reason}</p>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                Impact: {approvalGate.impactSummary}
              </p>
            </div>
          </div>

          {isGatePending && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onApproveGate(approvalGate.id)}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 shadow-sm transition"
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

      {/* Ready-to-Send WhatsApp Guest Broadcast Card */}
      {whatsappBroadcast && (
        <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-emerald-500/30 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 px-3 py-1 text-[11px] font-bold">
                WhatsApp Guest Broadcast Draft
              </span>
              {alertMessage && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">{alertMessage}</p>
              )}
            </div>
          </div>

          <pre className="whitespace-pre-wrap rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4 text-xs sm:text-sm font-sans text-slate-800 dark:text-slate-200 leading-relaxed">
            {whatsappBroadcast}
          </pre>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Optional phone (e.g. 9876543210) or leave blank to pick group"
              className="premium-input flex-1 !py-2.5 text-xs"
            />

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200/70 dark:hover:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy Text'}
            </button>

            {isGateApproved ? (
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 shadow-md shadow-emerald-600/20 transition"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open in WhatsApp
              </a>
            ) : (
              <span className="inline-flex items-center justify-center rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold px-4 py-2.5">
                Click Approve above to send
              </span>
            )}
          </div>
        </div>
      )}

      {/* Live Updated IST Schedule */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-teal-700 dark:text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Live Updated IST Schedule ({sessions.length} Sessions)
          </h3>
        </div>

        <div className="space-y-2.5">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-cyan-500/10 text-teal-800 dark:text-cyan-300 border border-cyan-500/20 px-2.5 py-1 font-mono text-xs font-bold">
                  {s.startTime}–{s.endTime}
                </span>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{s.title}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{s.speaker}</div>
                </div>
              </div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {s.room} ({s.expectedAttendance}/{s.roomCapacity})
              </div>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.008 }}
          whileTap={{ scale: 0.985 }}
          type="button"
          disabled={loading}
          onClick={onComputeRoi}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm py-3.5 px-6 shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
        >
          Compute Event Results & ROEI <ArrowRight className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}