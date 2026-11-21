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
import {
  Cpu,
  Network,
  Trash2,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const STEPS = [
  { id: 0, short: '01', label: 'Event Brief' },
  { id: 1, short: '02', label: 'Plan & GST Audit' },
  { id: 2, short: '03', label: 'Live Ops' },
  { id: 3, short: '04', label: 'ROEI & Matches' },
];

const STORAGE_KEY = 'eventmind_blackboard_v2';
const THEME_KEY = 'eventmind_theme';

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [isDark, setIsDark] = useState(false);
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
    setIsDark(document.documentElement.classList.contains('dark'));
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

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch {
      // Ignore storage errors
    }
  };

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
    <div className="relative min-h-screen bg-saas-grid">
      {/* Ambient top gradient aura */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-indigo-500/10 via-violet-500/5 to-transparent dark:from-indigo-500/15 dark:via-violet-500/5" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Executive Glassmorphic Command Header */}
        <header className="mb-6 rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm backdrop-blur-md transition-colors dark:border-slate-800/90 dark:bg-[#111827]/85">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    EventMind AI
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
                    <Sparkles className="h-2.5 w-2.5" />
                    India Enterprise Edition
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Autonomous ReAct Multi-Agent Event Orchestration • INR & 18% GST Engine
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setArchOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-700 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-indigo-500/50 dark:hover:bg-slate-800 dark:hover:text-indigo-300"
              >
                <Network className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Architecture</span>
              </button>

              {/* Dark / Light Theme Switcher */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle color theme"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-amber-300 dark:hover:bg-slate-800"
              >
                {isDark ? (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>

              {sessions.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetSession}
                  title="Reset workspace"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 4-Stage Stepper Bar */}
          <nav className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3.5 sm:grid-cols-4 dark:border-slate-800/80">
            {STEPS.map((s) => {
              const unlocked =
                s.id === 0 ||
                (s.id === 1 && sessions.length > 0) ||
                (s.id === 2 && sessions.length > 0) ||
                (s.id === 3 && roi !== null);
              const isActive = step === s.id;
              const isCompleted =
                (s.id === 0 && sessions.length > 0) ||
                (s.id === 1 && step > 1) ||
                (s.id === 2 && roi !== null);

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => setStep(s.id)}
                  className={`flex items-center justify-between rounded-xl border px-3.5 py-2 text-left text-xs font-semibold transition ${
                    isActive
                      ? 'border-indigo-600 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25 dark:border-indigo-500'
                      : unlocked
                      ? 'border-slate-200 bg-slate-50/80 text-slate-700 hover:border-indigo-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800'
                      : 'cursor-not-allowed border-slate-100 bg-slate-50/40 text-slate-400 dark:border-slate-800/40 dark:bg-slate-900/30 dark:text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span
                      className={`font-mono text-[10px] ${
                        isActive
                          ? 'text-indigo-200'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {s.short}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </span>
                  {isCompleted && !isActive && (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 dark:text-emerald-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </header>

        {error && (
          <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
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