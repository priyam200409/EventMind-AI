'use client';

import { useState } from 'react';
import { AgentLog, EventBrief, Session, VendorQuote } from '@/types/blackboard';
import { DEMO_PRESET } from '@/lib/presets';
import { RoiResult } from '@/lib/agents/roiMatch';
import { StageBrief } from '@/components/StageBrief';
import { StagePlan } from '@/components/StagePlan';
import { StageLiveOps } from '@/components/StageLiveOps';
import { StageRoi } from '@/components/StageRoi';
import { AgentStream } from '@/components/AgentStream';
import { Cpu } from 'lucide-react';

const STEPS = ['1. Event Brief', '2. AI Plan & Audit', '3. Live Ops', '4. ROI & Matches'];

export default function HomePage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<EventBrief>(DEMO_PRESET);
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [conflictsResolved, setConflictsResolved] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string>();
  const [roi, setRoi] = useState<RoiResult | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const callApi = async (payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Agent execution failed');
      if (data.logs) setLogs((prev) => [...prev, ...data.logs]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleRunPlan = async (newBrief: EventBrief) => {
    setBrief(newBrief);
    setLogs([]);
    const data = await callApi({ action: 'plan', brief: newBrief });
    if (data) {
      setQuotes(data.quotes);
      setSessions(data.sessions);
      setConflictsResolved(data.conflictsResolved);
      setStep(1);
    }
  };

  const handleCrisis = async (crisis: string) => {
    const data = await callApi({ action: 'crisis', sessions, crisis });
    if (data) {
      setSessions(data.sessions);
      setAlertMessage(data.alertMessage);
    }
  };

  const handleComputeRoi = async () => {
    const data = await callApi({ action: 'roi', brief, quotes, sessions });
    if (data) {
      setRoi(data.roi);
      setStep(3);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-indigo-600 p-2 text-white">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">EventMind AI</h1>
            <p className="text-xs text-slate-500">Autonomous Enterprise Event Planning & Real-Time Orchestration</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-1.5">
          {STEPS.map((label, idx) => (
            <button
              key={label}
              disabled={idx > step && !(idx === 2 && sessions.length > 0)}
              onClick={() => setStep(idx)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                step === idx
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 disabled:opacity-40'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <main className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {step === 0 && <StageBrief initialBrief={brief} loading={loading} onRunPlan={handleRunPlan} />}
          {step === 1 && (
            <StagePlan
              quotes={quotes}
              sessions={sessions}
              conflictsResolved={conflictsResolved}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StageLiveOps
              sessions={sessions}
              alertMessage={alertMessage}
              loading={loading}
              onTriggerCrisis={handleCrisis}
              onComputeRoi={handleComputeRoi}
            />
          )}
          {step === 3 && roi && <StageRoi roi={roi} onReset={() => setStep(0)} />}
        </div>

        <div>
          <AgentStream logs={logs} />
        </div>
      </main>
    </div>
  );
}