'use client';

import { useState } from 'react';
import { ApprovalGate, IndianCity, Session } from '@/types/blackboard';
import { INDIAN_CRISIS_PRESETS } from '@/lib/presets';
import {
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Check,
  X,
  Send,
} from 'lucide-react';

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
  city?: IndianCity;
  sessions: Session[];
  alertMessage?: string;
  whatsappBroadcast?: string;
  approvalGate?: ApprovalGate | null;
  loading: boolean;
  onApproveGate?: (id: string) => void;
  onRejectGate?: (id: string) => void;
  onTriggerCrisis: (crisis: string) => void;
  onComputeRoi: () => void;
}) {
  const [customCrisis, setCustomCrisis] = useState('');
  const presets = INDIAN_CRISIS_PRESETS[city] ?? INDIAN_CRISIS_PRESETS.Bengaluru;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCrisis.trim()) return;
    onTriggerCrisis(customCrisis.trim());
    setCustomCrisis('');
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-4">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
          Stage 3 • Real-Time Disruption Recovery ({city})
        </span>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Live Event Command Center (Chaos Mode)
        </h2>
        <p className="text-xs text-slate-500">
          Inject a live {city} operational emergency to watch the LiveOps ReAct Agent re-route rooms, verify zero conflicts, and queue WhatsApp alerts.
        </p>
      </div>

      {/* City-Specific Indian Chaos Presets */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          1-Click {city} Disruption Scenarios
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((crisis) => (
            <button
              key={crisis}
              type="button"
              disabled={loading}
              onClick={() => onTriggerCrisis(crisis)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-3 py-2 text-left text-xs font-medium text-amber-950 transition hover:bg-amber-100 disabled:opacity-50"
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>{crisis}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Disruption Input */}
      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          value={customCrisis}
          onChange={(e) => setCustomCrisis(e.target.value)}
          placeholder={`Simulate custom ${city} disruption (e.g., VIP security protocol at Main Hall)...`}
          className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !customCrisis.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          Inject
        </button>
      </form>

      {/* HITL Gate for Major Live Schedule Shifts */}
      {approvalGate && approvalGate.agent === 'LiveOps' && (
        <div
          className={`rounded-xl border p-4 ${
            approvalGate.status === 'approved'
              ? 'border-emerald-200 bg-emerald-50/70'
              : approvalGate.status === 'rejected'
              ? 'border-rose-200 bg-rose-50/70'
              : 'border-amber-300 bg-amber-50'
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <div className="text-xs font-bold text-slate-900">
                  LiveOps HITL Sign-Off ({approvalGate.status.toUpperCase()})
                </div>
                <p className="mt-0.5 text-xs text-slate-800">{approvalGate.reason}</p>
                <p className="mt-0.5 text-[11px] text-slate-600">{approvalGate.impactSummary}</p>
              </div>
            </div>

            {approvalGate.status === 'pending' && onApproveGate && onRejectGate && (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onApproveGate(approvalGate.id)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve Broadcast
                </button>
                <button
                  type="button"
                  onClick={() => onRejectGate(approvalGate.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Hold
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp Business & SMS Notification Preview */}
      {(whatsappBroadcast || alertMessage) && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              <span>WhatsApp Business & SMS Delegate Broadcast</span>
            </div>
            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              Verified Payload
            </span>
          </div>
          <p className="mt-2 rounded-lg border border-emerald-200/80 bg-white p-2.5 font-mono text-[11px] text-slate-800">
            {whatsappBroadcast ?? alertMessage}
          </p>
        </div>
      )}

      {/* Live Hall Occupancy Cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {sessions.map((s) => {
          const pct = Math.min(
            100,
            Math.round((s.expectedAttendance / s.roomCapacity) * 100)
          );
          return (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs"
            >
              <div className="flex items-start justify-between gap-2 font-semibold text-slate-900">
                <span>{s.title}</span>
                <span className="shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-700 border border-slate-200">
                  {s.startTime}–{s.endTime}
                </span>
              </div>
              <div className="mt-1 text-slate-600">
                {s.room} • {s.speaker}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <span>Occupancy Load</span>
                <span className="font-mono font-semibold">
                  {s.expectedAttendance}/{s.roomCapacity} ({pct}%)
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-200">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    pct > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          disabled={loading}
          onClick={onComputeRoi}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading
            ? 'Computing Indian Enterprise ROEI...'
            : 'Generate Post-Event Matchmaking & ROI'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}