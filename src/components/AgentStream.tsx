'use client';
import { useState } from 'react';
import { AgentLog } from '@/types/blackboard';
import { Terminal, Code2, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AgentStream({ logs }: { logs: AgentLog[] }) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  return (
    <div className="glass-panel !bg-[#0A0A0A] !border-slate-800 rounded-2xl p-5 sticky top-24 max-h-[85vh] flex flex-col shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
          <Terminal className="h-4 w-4 text-indigo-400" />
          Neural Stream
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20 font-mono uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping-slow" /> Live Telemetry
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin relative z-10">
        <AnimatePresence>
          {logs.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-slate-500 text-center py-10 font-mono border border-dashed border-slate-800 rounded-lg bg-[#030712]/80">
              Awaiting orchestration triggers...
            </motion.div>
          ) : (
            logs.map((log, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="bg-[#030712] border border-slate-800 rounded-lg p-3"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                    log.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                  }`}>{log.agent}</span>
                  <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                </div>
                <p className="text-xs text-slate-300 mb-2 leading-relaxed">{log.message}</p>
                {log.toolTraces && log.toolTraces.length > 0 && (
                  <div className="border-t border-slate-800 pt-2">
                    <button onClick={() => setExpanded(p => ({...p, [i]: !p[i]}))} className="flex items-center justify-between w-full text-[10px] text-indigo-400 font-mono hover:text-indigo-300 transition-colors">
                      <span className="flex items-center gap-1.5"><Code2 className="h-3 w-3"/> {log.toolTraces.length} Tool Executions</span>
                      {expanded[i] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3"/>}
                    </button>
                    {expanded[i] && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-1.5">
                        {log.toolTraces.map((t, idx) => (
                          <div key={idx} className="bg-black/80 rounded border border-slate-800 p-2 font-mono text-[10px]">
                            <div className="text-emerald-400 mb-1">{t.toolName}() <span className="text-slate-500 ml-2">{t.durationMs}ms</span></div>
                            <div className="text-slate-400 truncate">in: {t.inputSummary}</div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}