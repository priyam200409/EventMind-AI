'use client';

import { Session } from '@/types/blackboard';
import { AlertTriangle, Bell, ArrowRight } from 'lucide-react';

const CRISIS_PRESETS = [
  'Keynote speaker flight delayed by 45 minutes',
  'Projector & audio failure in Innovation Theater B',
  'Main Keynote Hall overflow (+120 unexpected walk-ins)',
];

export function StageLiveOps({
  sessions,
  alertMessage,
  loading,
  onTriggerCrisis,
  onComputeRoi,
}: {
  sessions: Session[];
  alertMessage?: string;
  loading: boolean;
  onTriggerCrisis: (crisis: string) => void;
  onComputeRoi: () => void;
}) {
  return (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">3. Live Event Command Center (Chaos Mode)</h2>
        <p className="text-sm text-slate-500">Simulate a live operational disruption to watch the LiveOps Agent self-heal the schedule.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {CRISIS_PRESETS.map((crisis) => (
          <button
            key={crisis}
            disabled={loading}
            onClick={() => onTriggerCrisis(crisis)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            {crisis}
          </button>
        ))}
      </div>

      {alertMessage && (
        <div className="flex items-start gap-2.5 rounded-lg border border-indigo-200 bg-indigo-50 p-3.5 text-xs text-indigo-950">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
          <div>
            <div className="font-semibold">Dispatched Attendee & Staff Alert:</div>
            <p className="mt-0.5">{alertMessage}</p>
          </div>
        </div>
      )}

      <div className="grid gap-2.5 sm:grid-cols-2">
        {sessions.map((s) => {
          const pct = Math.min(100, Math.round((s.expectedAttendance / s.roomCapacity) * 100));
          return (
            <div key={s.id} className="rounded-lg border border-slate-200 p-3 text-xs">
              <div className="flex justify-between font-semibold text-slate-900">
                <span>{s.title}</span>
                <span>{s.startTime}–{s.endTime}</span>
              </div>
              <div className="mt-1 text-slate-500">{s.room} • {s.speaker}</div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full ${pct > 90 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          disabled={loading}
          onClick={onComputeRoi}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Calculating ROI...' : 'Generate Post-Event Matchmaking & ROI'}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}