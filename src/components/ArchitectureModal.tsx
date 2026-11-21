'use client';

import {
  X,
  Cpu,
  Database,
  Wrench,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export function ArchitectureModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  const layers = [
    {
      icon: Cpu,
      title: '1. Deterministic Supervisor Orchestrator',
      desc: 'Coordinates multi-stage workflow transitions (Brief → Plan & Audit → LiveOps → ROEI) and enforces strict Zod schema contracts across all agents.',
    },
    {
      icon: Wrench,
      title: '2. Autonomous ReAct Tool-Calling Agents',
      desc: 'Procurement and LiveOps agents run Reason → Act → Observe loops calling real TypeScript tools (searchIndianVendors, calculateCateringAndGst, auditScheduleConflicts, dispatchWhatsAppAlert).',
    },
    {
      icon: ShieldCheck,
      title: '3. Generator-Critic Self-Correction Loop',
      desc: 'Programmatically audits generated IST schedules for room clashes, speaker double-bookings, and capacity overflows—forcing automatic self-healing until 0 conflicts remain.',
    },
    {
      icon: UserCheck,
      title: '4. Human-in-the-Loop (HITL) Governance Gates',
      desc: 'Automatically pauses high-value Indian POs (≥92% budget utilization or ≥₹20L) and major keynote mutations (≥250 impacted attendees) for explicit operator sign-off.',
    },
    {
      icon: Database,
      title: '5. Shared Blackboard State & Multi-Model Resilience',
      desc: 'Unified typed state with local persistence, 18% GST (CGST+SGST) ledger math, and automatic fallback across Gemini 3.8 Flash and 3.5 Flash-Lite.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold text-indigo-300">
              System Design Blueprint
            </span>
            <h2 className="mt-1 text-lg font-bold text-white">
              EventMind AI — Autonomous Multi-Agent Architecture
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {layers.map((layer) => {
            const Icon = layer.icon;
            return (
              <div
                key={layer.title}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{layer.title}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {layer.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
          >
            Back to Command Center
          </button>
        </div>
      </div>
    </div>
  );
}