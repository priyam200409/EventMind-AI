'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { EventBrief, IndianCity } from '@/types/blackboard';
import { ALL_INDIAN_CITIES, CITY_BRIEF_PRESETS } from '@/lib/presets';
import { formatINR } from '@/lib/guardrails';
import { Play, MapPin, Target, Receipt, Sparkles, Bot } from 'lucide-react';

export function StageBrief({
  initialBrief,
  loading,
  onRunPlan,
  onRunAutoPilot,
}: {
  initialBrief: EventBrief;
  loading: boolean;
  onRunPlan: (brief: EventBrief) => void;
  onRunAutoPilot?: (brief: EventBrief, autoCrisisLabel?: string) => void;
}) {
  const [brief, setBrief] = useState<EventBrief>({
    ...initialBrief,
    city: initialBrief.city ?? 'Bengaluru',
    includeGst: initialBrief.includeGst ?? true,
  });
  const [tracksInput, setTracksInput] = useState(initialBrief.tracks.join(', '));
  const [autoPilot, setAutoPilot] = useState(false);
  const [autoCrisis, setAutoCrisis] = useState('Keynote speaker delayed by 30m in transit');

  const handleCityChange = (cityStr: string) => {
    const city = cityStr as IndianCity;
    const preset = CITY_BRIEF_PRESETS[city];
    if (preset) {
      setBrief(preset);
      setTracksInput(preset.tracks.join(', '));
    } else {
      setBrief((prev) => ({ ...prev, city }));
    }
  };

  const buildCleanedBrief = (): EventBrief => {
    const tracks = tracksInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      ...brief,
      tracks: tracks.length ? tracks : ['AI & Cloud', 'Product & Growth', 'Enterprise Ops'],
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = buildCleanedBrief();
    if (autoPilot && onRunAutoPilot) {
      onRunAutoPilot(cleaned, autoCrisis);
    } else {
      onRunPlan(cleaned);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Event Core Card */}
      <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-cyan-500/20">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Event Architecture</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure scale, tracks, and host hub across {ALL_INDIAN_CITIES.length} Indian cities.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 px-3 py-1 text-[11px] font-semibold">
            <Sparkles className="h-3 w-3" /> Agent Ready
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Event Title
            </label>
            <input
              required
              value={brief.title}
              onChange={(e) => setBrief({ ...brief, title: e.target.value })}
              className="premium-input"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Expected Delegates
            </label>
            <input
              type="number"
              min={50}
              max={10000}
              value={brief.attendees}
              onChange={(e) => setBrief({ ...brief, attendees: Number(e.target.value) })}
              className="premium-input font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Session Tracks (Comma-Separated)
            </label>
            <input
              value={tracksInput}
              onChange={(e) => setTracksInput(e.target.value)}
              placeholder="Agentic AI, FinTech, Cloud"
              className="premium-input"
            />
          </div>
        </div>
      </div>

      {/* Location + Budget Grid */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <MapPin className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">City & Venue Format</h3>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Host City ({ALL_INDIAN_CITIES.length} Hubs)
            </label>
            <select
              value={brief.city}
              onChange={(e) => handleCityChange(e.target.value)}
              className="premium-input"
            >
              {ALL_INDIAN_CITIES.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city} — {c.region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Venue Type
            </label>
            <select
              value={brief.venueType}
              onChange={(e) =>
                setBrief({ ...brief, venueType: e.target.value as EventBrief['venueType'] })
              }
              className="premium-input"
            >
              <option value="Convention Center">Convention Center</option>
              <option value="Luxury Hotel">Luxury Hotel</option>
              <option value="Tech Campus">Tech Campus</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <Receipt className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Budget & 18% GST</h3>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Max Budget Cap
              </span>
              <span className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-1 text-xs font-mono font-bold">
                {formatINR(brief.budget)}
              </span>
            </div>

            <input
              type="range"
              min={500000}
              max={20000000}
              step={100000}
              value={brief.budget}
              onChange={(e) => setBrief({ ...brief, budget: Number(e.target.value) })}
              className="w-full accent-cyan-600 cursor-pointer"
            />
          </div>

          <label className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">Apply 18% GST Ledger</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                9% CGST + 9% SGST calculation
              </div>
            </div>
            <input
              type="checkbox"
              checked={brief.includeGst ?? true}
              onChange={(e) => setBrief({ ...brief, includeGst: e.target.checked })}
              className="h-4 w-4 accent-cyan-600 rounded cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Autonomous Auto-Pilot Box */}
      {onRunAutoPilot && (
        <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-emerald-500/10 border border-cyan-500/25 p-4 space-y-3">
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <div className="flex items-center gap-2.5">
              <Bot className="h-4 w-4 text-teal-700 dark:text-cyan-400 shrink-0" />
              <div>
                <div className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Autonomous Auto-Pilot Chain
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Automatically runs Vendor + GST Audit, LiveOps stress test, and ROEI forecast in one click.
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoPilot}
              onChange={(e) => setAutoPilot(e.target.checked)}
              className="h-4 w-4 accent-indigo-600 rounded cursor-pointer"
            />
          </label>

          {autoPilot && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Auto-Simulated LiveOps Scenario
              </label>
              <input
                value={autoCrisis}
                onChange={(e) => setAutoCrisis(e.target.value)}
                className="premium-input !py-2 text-xs"
              />
            </div>
          )}
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.008 }}
        whileTap={{ scale: 0.985 }}
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-emerald-500 text-white font-bold text-sm py-4 px-6 shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            {autoPilot ? 'Running Autonomous Auto-Pilot...' : 'Orchestrating Plan & Schedule...'}
          </>
        ) : (
          <>
            {autoPilot ? <Bot className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            {autoPilot ? 'Run Full Autonomous Auto-Pilot' : 'Launch Autonomous Orchestration'}
          </>
        )}
      </motion.button>
    </form>
  );
}