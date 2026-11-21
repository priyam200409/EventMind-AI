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
    const selected = INDIAN_DEMO_PRESETS[key];
    setBrief(selected);
    setTracksInput(selected.tracks.join(', '));
  };

  const dietary = brief.dietarySplit ?? { vegPct: 55, jainPct: 15, nonVegPct: 30 };

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

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* Header & 1-Click Indian Metro Presets */}
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
            Stage 1 • Enterprise Parameters
          </span>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            Configure Indian Enterprise Event Brief
          </h2>
          <p className="text-xs text-slate-500">
            Customize parameters or load a 1-click Indian metro preset for instant orchestration.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset('bengaluru')}
            className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
          >
            <Sparkles className="h-3 w-3" />
            Bengaluru Summit
          </button>
          <button
            type="button"
            onClick={() => applyPreset('mumbai')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Mumbai FinTech
          </button>
          <button
            type="button"
            onClick={() => applyPreset('delhi')}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Delhi GovTech
          </button>
        </div>
      </div>

      {/* Core Event Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700">
            Event Title
          </label>
          <input
            required
            value={brief.title}
            onChange={(e) => setBrief({ ...brief, title: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <MapPin className="h-3.5 w-3.5 text-indigo-600" />
            Host Metro City
          </label>
          <select
            value={brief.city ?? 'Bengaluru'}
            onChange={(e) =>
              setBrief({ ...brief, city: e.target.value as IndianCity })
            }
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            <option value="Bengaluru">Bengaluru (ITPL / BIEC)</option>
            <option value="Mumbai">Mumbai (BKC / Airport Corridor)</option>
            <option value="Delhi NCR">Delhi NCR (Dwarka / Aerocity)</option>
            <option value="Hyderabad">Hyderabad (HITEC City)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700">
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
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          >
            <option value="Convention Center">Convention Center</option>
            <option value="Luxury Hotel">Luxury 5-Star Hotel Ballroom</option>
            <option value="Tech Campus">Enterprise Tech Campus</option>
          </select>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Users className="h-3.5 w-3.5 text-indigo-600" />
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
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 text-xs font-semibold text-slate-700">
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
              Max Budget Cap (INR)
            </label>
            <span className="text-[11px] font-semibold text-emerald-700">
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
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-700">
            Conference Tracks (comma-separated)
          </label>
          <input
            value={tracksInput}
            onChange={(e) => setTracksInput(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Regional Catering Mix & 18% GST Compliance Bar */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Utensils className="h-3.5 w-3.5 text-indigo-600" />
            Regional Catering & Dietary Mix (%)
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={brief.includeGst ?? true}
              onChange={(e) =>
                setBrief({ ...brief, includeGst: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600"
            />
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Include 18% Indian GST (9% CGST + 9% SGST)
          </label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600">
              Pure Veg (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={dietary.vegPct}
              onChange={(e) => updateDietary('vegPct', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-amber-700">
              Jain Certified (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={dietary.jainPct}
              onChange={(e) => updateDietary('jainPct', Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-amber-300 bg-amber-50/40 px-2.5 py-1.5 text-xs font-medium"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600">
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
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-slate-500">
          Autonomous agents will query {brief.city ?? 'Bengaluru'} vendors, compute 18% GST, and audit schedule collisions.
        </p>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
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