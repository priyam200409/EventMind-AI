'use client';

import { useEffect, useState } from 'react';
import {
  AgentLog,
  ApprovalGate,
  EventBrief,
  Session,
  VendorQuote,
} from '@/types/blackboard';
import { DEMO_PRESET } from '@/lib/presets';
import { RoiResult } from '@/lib/agents/roiMatch';
import { StageBrief } from '@/components/StageBrief';
import { StagePlan } from '@/components/StagePlan';
import { StageLiveOps } from '@/components/StageLiveOps';
import { StageRoi } from '@/components/StageRoi';
import { AgentStream } from '@/components/AgentStream';
import { ArchitectureModal } from '@/components/ArchitectureModal';
import { Cpu, Network, Trash2 } from 'lucide-react';

const STEPS = [
  '1. Event Brief',
  '2. Plan & GST Audit',
  '3. Live Ops',
  '4. ROEI & Matches',
];

const STORAGE_KEY = 'eventmind_blackboard_v2';

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [archOpen, setArchOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<EventBrief>(DEMO_PRESET);
  const [quotes, setQuotes] = useState<VendorQuote[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [conflictsResolved, setConflictsResolved] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string>();
  const [whatsappBroadcast, setWhatsappBroadcast] = useState<string>();
  const [approvalGate, setApprovalGate] = useState<ApprovalGate | null>(null);
  const [roi, setRoi] = useState<RoiResult | null>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.step === 'number') setStep(parsed.step);
        if (parsed.brief) setBrief(parsed.brief);
        if (Array.isArray(parsed.quotes)) setQuotes(parsed.quotes);
        if (Array.isArray(parsed.sessions)) setSessions(parsed.sessions);
        if (typeof parsed.conflictsResolved === 'number')
          setConflictsResolved(parsed.conflictsResolved);
        if (parsed.alertMessage) setAlertMessage(parsed.alertMessage);
        if (parsed.whatsappBroadcast)
          setWhatsappBroadcast(parsed.whatsappBroadcast);
        if (parsed.approvalGate) setApprovalGate(parsed.approvalGate);
        if (parsed.roi) setRoi(parsed.roi);
        if (Array.isArray(parsed.logs)) setLogs(parsed.logs);
      }
    } catch {
      // Ignore corrupted local state
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step,
          brief,
          quotes,
          sessions,
          conflictsResolved,
          alertMessage,
          whatsappBroadcast,
          approvalGate,
          roi,
          logs,
        })
      );
    } catch {
      // Ignore storage quota issues
    }
  }, [
    hydrated,
    step,
    brief,
    quotes,
    sessions,
    conflictsResolved,
    alertMessage,
    whatsappBroadcast,
    approvalGate,
    roi,
    logs,
  ]);

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
    setAlertMessage(undefined);
    setWhatsappBroadcast(undefined);
    setApprovalGate(null);
    const data = await callApi({ action: 'plan', brief: newBrief });
    if (data) {
      setQuotes(data.quotes);
      setSessions(data.sessions);
      setConflictsResolved(data.conflictsResolved);
      setApprovalGate(data.approvalGate ?? null);
      setStep(1);
    }
  };

  const handleCrisis = async (crisis: string) => {
    const data = await callApi({
      action: 'crisis',
      sessions,
      crisis,
      city: brief.city ?? 'Bengaluru',
    });
    if (data) {
      setSessions(data.sessions);
      setAlertMessage(data.alertMessage);
      setWhatsappBroadcast(data.whatsappBroadcast);
      if (data.approvalGate) setApprovalGate(data.approvalGate);
    }
  };

  const handleComputeRoi = async () => {
    const data = await callApi({ action: 'roi', brief, quotes, sessions });
    if (data) {
      setRoi(data.roi);
      setStep(3);
    }
  };

  const handleGateDecision = (id: string, status: 'approved' | 'rejected') => {
    if (!approvalGate || approvalGate.id !== id) return;
    setApprovalGate({ ...approvalGate, status });
    setLogs((prev) => [
      ...prev,
      {
        agent: 'Orchestrator',
        message: `Operator ${status.toUpperCase()} HITL gate (${approvalGate.agent}): ${approvalGate.reason}`,
        status: status === 'approved' ? 'success' : 'warning',
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      },
    ]);
  };

  const handleResetSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep(0);
    setQuotes([]);
    setSessions([]);
    setConflictsResolved(0);
    setAlertMessage(undefined);
    setWhatsappBroadcast(undefined);
    setApprovalGate(null);
    setRoi(null);
    setLogs([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/80">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Executive Top Command Bar */}
        <header className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-600 p-2.5 text-white shadow-xs">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                    EventMind AI
                  </h1>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                    India Enterprise Edition
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Autonomous ReAct Multi-Agent Event Orchestration • INR & 18% GST Engine
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setArchOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Network className="h-3.5 w-3.5 text-indigo-600" />
                Architecture
              </button>

              {sessions.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetSession}
                  title="Clear saved session"
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 4-Stage Stepper Navigation */}
          <nav className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {STEPS.map((label, idx) => {
              const unlocked =
                idx === 0 ||
                (idx === 1 && sessions.length > 0) ||
                (idx === 2 && sessions.length > 0) ||
                (idx === 3 && roi !== null);

              return (
                <button
                  key={label}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => setStep(idx)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                    step === idx
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </header>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <main className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {step === 0 && (
              <StageBrief
                initialBrief={brief}
                loading={loading}
                onRunPlan={handleRunPlan}
              />
            )}
            {step === 1 && (
              <StagePlan
                quotes={quotes}
                sessions={sessions}
                conflictsResolved={conflictsResolved}
                budget={brief.budget}
                includeGst={brief.includeGst ?? true}
                approvalGate={approvalGate}
                onApproveGate={(id) => handleGateDecision(id, 'approved')}
                onRejectGate={(id) => handleGateDecision(id, 'rejected')}
                onNext={() => setStep(2)}
              />
            )}
            {step === 2 && (
              <StageLiveOps
                city={brief.city ?? 'Bengaluru'}
                sessions={sessions}
                alertMessage={alertMessage}
                whatsappBroadcast={whatsappBroadcast}
                approvalGate={approvalGate}
                loading={loading}
                onApproveGate={(id) => handleGateDecision(id, 'approved')}
                onRejectGate={(id) => handleGateDecision(id, 'rejected')}
                onTriggerCrisis={handleCrisis}
                onComputeRoi={handleComputeRoi}
              />
            )}
            {step === 3 && roi && (
              <StageRoi
                brief={brief}
                quotes={quotes}
                sessions={sessions}
                roi={roi}
                onReset={handleResetSession}
              />
            )}
          </div>

          <div>
            <AgentStream logs={logs} />
          </div>
        </main>
      </div>

      <ArchitectureModal open={archOpen} onClose={() => setArchOpen(false)} />
    </div>
  );
}