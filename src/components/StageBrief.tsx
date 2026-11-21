'use client';

import { useState } from 'react';
import { EventBrief } from '@/types/blackboard';
import { DEMO_PRESET } from '@/lib/presets';
import { Sparkles, Play } from 'lucide-react';

export function StageBrief({
  initialBrief,
  loading,
  onRunPlan,
}: {
  initialBrief: EventBrief;
  loading: boolean;
  onRunPlan: (brief: EventBrief) => void;
}) {
  const [brief, setBrief] = useState<EventBrief>(initialBrief);
  const [tracksInput, setTracksInput] = useState(initialBrief.tracks.join(', '));

  const loadPreset = () => {
    setBrief(DEMO_PRESET);
    setTracksInput(DEMO_PRESET.tracks.join(', '));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tracks = tracksInput.split(',').map((t) => t.trim()).filter(Boolean);
    onRunPlan({ ...brief, tracks: tracks.length ? tracks : ['General'] });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">1. Enterprise Event Brief</h2>
          <p className="text-sm text-slate-500">Define parameters or load the preset for an instant demo.</p>
        </div>
        <button
          type="button"
          onClick={loadPreset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Load Demo Preset
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-slate-700">Event Title</label>
          <input
            required
            value={brief.title}
            onChange={(e) => setBrief({ ...brief, title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Expected Attendees</label>
          <input
            type="number"
            min={50}
            max={5000}
            value={brief.attendees}
            onChange={(e) => setBrief({ ...brief, attendees: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Max Budget ($ USD)</label>
          <input
            type="number"
            min={5000}
            value={brief.budget}
            onChange={(e) => setBrief({ ...brief, budget: Number(e.target.value) })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Venue Type</label>
          <select
            value={brief.venueType}
            onChange={(e) => setBrief({ ...brief, venueType: e.target.value as EventBrief['venueType'] })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="Convention Center">Convention Center</option>
            <option value="Luxury Hotel">Luxury Hotel</option>
            <option value="Tech Campus">Tech Campus</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700">Conference Tracks (comma-separated)</label>
          <input
            value={tracksInput}
            onChange={(e) => setTracksInput(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        <Play className="h-4 w-4" />
        {loading ? 'Agents Planning & Auditing...' : 'Launch Autonomous Planning'}
      </button>
    </form>
  );
}