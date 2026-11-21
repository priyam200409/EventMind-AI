'use client';

import { AgentLog } from '@/types/blackboard';
import { Terminal } from 'lucide-react';

export function AgentStream({ logs }: { logs: AgentLog[] }) {
  const badgeColor = {
    info: 'bg-blue-500/20 text-blue-300',
    warning: 'bg-amber-500/20 text-amber-300',
    success: 'bg-emerald-500/20 text-emerald-300',
  };

  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-slate-100">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-2 text-sm font-semibold">
        <Terminal className="h-4 w-4 text-indigo-400" />
        <span>Agent Neural Stream</span>
      </div>
      <div className="space-y-3 max-h-[540px] overflow-y-auto text-xs">
        {logs.length === 0 && (
          <p className="text-slate-400">Awaiting event brief to initialize agents...</p>
        )}
        {logs.map((log, idx) => (
          <div key={idx} className="rounded-lg bg-slate-950/70 p-2.5 border border-slate-800/80">
            <div className="mb-1 flex items-center justify-between">
              <span className={`rounded px-1.5 py-0.5 font-medium ${badgeColor[log.status]}`}>
                {log.agent}
              </span>
              <span className="text-[10px] text-slate-500">{log.timestamp}</span>
            </div>
            <p className="text-slate-300 leading-relaxed">{log.message}</p>
          </div>
        ))}
      </div>
    </aside>
  );
}