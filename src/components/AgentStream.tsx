'use client';

import { useState } from 'react';
import { AgentLog } from '@/types/blackboard';
import {
  Terminal,
  Wrench,
  ChevronDown,
  ChevronRight,
  Clock,
} from 'lucide-react';

export function AgentStream({ logs }: { logs: AgentLog[] }) {
  const [expandedTraces, setExpandedTraces] = useState<Record<number, boolean>>({});

  const badgeColor: Record<AgentLog['status'], string> = {
    info: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  };

  const toggleTrace = (idx: number) => {
    setExpandedTraces((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <aside className="sticky top-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-slate-100 shadow-lg">
      <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <Terminal className="h-4 w-4 text-indigo-400" />
          <span>Agent Neural Stream</span>
        </div>
        <span className="rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-slate-400 border border-slate-800">
          ReAct Telemetry
        </span>
      </div>

      <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1 text-xs">
        {logs.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center text-slate-400">
            Select an Indian city preset and launch planning to inspect live agent tool calls and Critic audits.
          </div>
        )}

        {logs.map((log, idx) => {
          const hasTraces = Boolean(log.toolTraces && log.toolTraces.length > 0);
          const isOpen = expandedTraces[idx] ?? true;

          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-800/90 bg-slate-900/80 p-3 transition hover:border-slate-700"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${badgeColor[log.status]}`}
                >
                  {log.agent}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {log.timestamp}
                </span>
              </div>

              <p className="text-slate-200 leading-relaxed">{log.message}</p>

              {hasTraces && log.toolTraces && (
                <div className="mt-2.5 border-t border-slate-800/80 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleTrace(idx)}
                    className="flex w-full items-center justify-between text-[11px] font-medium text-indigo-300 hover:text-indigo-200"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Wrench className="h-3 w-3" />
                      {log.toolTraces.length} Executable Tool Call
                      {log.toolTraces.length > 1 ? 's' : ''}
                    </span>
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="mt-2 space-y-1.5">
                      {log.toolTraces.map((trace, tIdx) => (
                        <div
                          key={tIdx}
                          className="rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-[10px]"
                        >
                          <div className="flex items-center justify-between text-emerald-400">
                            <span className="font-semibold">{trace.toolName}()</span>
                            <span className="inline-flex items-center gap-0.5 text-slate-500">
                              <Clock className="h-2.5 w-2.5" />
                              {trace.durationMs}ms
                            </span>
                          </div>
                          <div className="mt-1 truncate text-slate-400" title={trace.inputSummary}>
                            in: {trace.inputSummary}
                          </div>
                          <div className="mt-0.5 line-clamp-2 text-slate-300" title={trace.outputSummary}>
                            out: {trace.outputSummary}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}