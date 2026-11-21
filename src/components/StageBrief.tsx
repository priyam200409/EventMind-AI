'use client';

import { useState } from 'react';
import { EventBrief, IndianCity } from '@/types/blackboard';
import { INDIAN_DEMO_PRESETS } from '@/lib/presets';
import { formatINR } from '@/lib/guardrails';
import {
  Sparkles,
  Play,
  MapPin,
  Users,
  IndianRupee,
  Utensils,
  ShieldCheck,
} from 'lucide-react';

export function StageBrief({
  initialBrief,
  loading,
  onRunPlan,
}: {
  initialBrief: EventBrief;
  loading: boolean;
  onRunPlan: (brief: EventBrief) => void;
}) {
  const [activePreset, setActivePreset] = useState<'bengaluru' | 'mumbai' | 'delhi'>('bengaluru');
  const [brief, setBrief] = useState<EventBrief>({
    ...initialBrief,
    city: initialBrief.city ?? 'Bengaluru',
    includeGst: initialBrief.includeGst ?? true,
    dietarySplit: initialBrief.dietarySplit ?? {
      vegPct: 55,
      jainPct: 15,
      nonVegPct: 30,
    },
  });
  const [tracksInput, setTracksInput] = useState(initialBrief.tracks.join(', '));

  const applyPreset = (key: 'bengaluru' | 'mumbai' | 'delhi') => {
    setActivePreset(key);
    const selected = INDIAN_DEMO_PRESETS[key];
    setBrief(selected);
    setTracksInput(selected.tracks.join(', '));
  };

  const dietary = brief.dietarySplit ?? { vegPct: 55, jainPct: 15, nonVegPct: 30 };
  const totalDietary = Math.max(1, dietary.vegPct + dietary.jainPct + dietary.nonVegPct);

  const updateDietary = (field: 'vegPct' | 'jainPct' | 'nonVegPct', value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setBrief({
      ...brief,
      dietarySplit: {
        ...dietary,
        [field]: clamped,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tracks = tracksInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onRunPlan({
      ...brief,
      tracks: tracks.length ? tracks : ['General Tech'],
    });
  };

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-slate-300/90 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-2xs transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20';

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm transition-colors dark:border-slate-800 dark:bg-[#111827]"
    >
      {/* Header & Segmented Metro Presets */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
            Stage 01 • Enterprise Parameters
          </span>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Configure Indian Enterprise Event Brief
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Customize parameters or pick an Indian metro preset for instant autonomous orchestration.
          </p>
        </div>

        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
          {(
            [
              { key: 'bengaluru', label: 'Bengaluru' },
              { key: 'mumbai', label: 'Mumbai' },
              { key: 'delhi', label: 'Delhi NCR' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => applyPreset(tab.key)}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                activePreset === tab.key
                  ? 'bg-white text-indigo-700 shadow-2xs dark:bg-indigo-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.key === 'bengaluru' && <Sparkles className="h-3 w-3" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Core Event Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Event Title
          </label>
          <input
            required
            value={brief.title}
            onChange={(e) => setBrief({ ...brief, title: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Host Metro City
          </label>
          <select
            value={brief.city ?? 'Bengaluru'}
            onChange={(e) =>
              setBrief({ ...brief, city: e.target.value as IndianCity })
            }
            className={inputClass}
          >
            <option value="Bengaluru">Bengaluru (ITPL / BIEC)</option>
            <option value="Mumbai">Mumbai (BKC / Airport Corridor)</option>
            <option value="Delhi NCR">Delhi NCR (Dwarka / Aerocity)</option>
            <option value="Hyderabad">Hyderabad (HITEC City)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Venue Format
          </label>
          <select
            value={brief.venueType}
            onChange={(e) =>
              setBrief({
                ...brief,
                venueType: e.target.value as EventBrief['venueType'],
              })
            }
            className={inputClass}
          >
            <option value="Convention Center">Convention Center</option>
            <option value="Luxury Hotel">Luxury 5-Star Hotel Ballroom</option>
            <option value="Tech Campus">Enterprise Tech Campus</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            Expected Delegates
          </label>
          <input
            type="number"
            min={50}
            max={5000}
            value={brief.attendees}
            onChange={(e) =>
              setBrief({ ...brief, attendees: Number(e.target.value) })
            }
            className={`${inputClass} font-mono`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Max Budget Cap (INR)
            </label>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              {formatINR(brief.budget)}
            </span>
          </div>
          <input
            type="number"
            min={100000}
            step={50000}
            value={brief.budget}
            onChange={(e) =>
              setBrief({ ...brief, budget: Number(e.target.value) })
            }
            className={`${inputClass} font-mono`}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Conference Tracks (comma-separated)
          </label>
          <input
            value={tracksInput}
            onChange={(e) => setTracksInput(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* Regional Catering Mix & 18% GST Compliance Box */}
      <div className="space-y-3.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <Utensils className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Regional Catering & Dietary Mix (%)</span>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={brief.includeGst ?? true}
              onChange={(e) =>
                setBrief({ ...brief, includeGst: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Include 18% Indian GST (9% CGST + 9% SGST)</span>
          </label>
        </div>

        {/* Visual Stacked Dietary Bar */}
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            style={{ width: `${(dietary.vegPct / totalDietary) * 100}%` }}
            className="bg-emerald-500 transition-all"
            title={`Pure Veg: ${dietary.vegPct}%`}
          />
          <div
            style={{ width: `${(dietary.jainPct / totalDietary) * 100}%` }}
            className="bg-amber-400 transition-all"
            title={`Jain Certified: ${dietary.jainPct}%`}
          />
          <div
            style={{ width: `${(dietary.nonVegPct / totalDietary) * 100}%` }}
            className="bg-rose-500 transition-all"
            title={`Non-Veg: ${dietary.nonVegPct}%`}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Pure Veg (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={dietary.vegPct}
              onChange={(e) => updateDietary('vegPct', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Jain Certified (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={dietary.jainPct}
              onChange={(e) => updateDietary('jainPct', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-amber-300 bg-amber-50/40 px-2.5 py-1.5 font-mono text-xs font-medium text-slate-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-rose-700 dark:text-rose-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Non-Veg (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={dietary.nonVegPct}
              onChange={(e) =>
                updateDietary('nonVegPct', Number(e.target.value))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Agents will query {brief.city ?? 'Bengaluru'} vendors, compute 18% GST, and audit schedule collisions.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50"
        >
          <Play className="h-4 w-4" />
          {loading
            ? 'Agents Executing Tools & Auditing...'
            : 'Launch Autonomous Orchestration'}
        </button>
      </div>
    </form>
  );
}