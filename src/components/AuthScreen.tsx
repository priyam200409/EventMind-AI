'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu,
  Lock,
  Mail,
  User,
  Building2,
  ArrowRight,
  Compass,
  Layers,
  UserCheck,
  Trophy,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  PlusCircle,
} from 'lucide-react';

export interface StoredUserProfile {
  id?: string;
  name: string;
  email: string;
  role: string;
  organization: string;
  provider?: 'email' | 'google' | 'github';
  createdAt?: string;
  lastLogin: string;
}

const HOW_IT_WORKS_STEPS = [
  {
    num: '01',
    title: 'Define Event Brief',
    desc: 'Pick from 105+ Indian cities, delegate headcount, budget cap in INR, session tracks, and 18% GST rules.',
  },
  {
    num: '02',
    title: 'Multi-Agent Audit',
    desc: 'Sources city venues, catering, and AV, calculates 9% CGST + 9% SGST ledgers, and auto-heals IST room clashes.',
  },
  {
    num: '03',
    title: 'LiveOps Crisis Engine',
    desc: 'Simulates traffic delays, hall overflows, or AV faults and drafts instant WhatsApp guest updates with manager sign-off.',
  },
  {
    num: '04',
    title: 'ROEI & Executive Report',
    desc: 'Computes ROEI multiplier, qualified leads, pipeline INR, B2B sponsor matches, and downloadable Markdown reports.',
  },
];

const OUTCOMES = [
  'Itemized INR base cost + 9% CGST + 9% SGST ledger checked against budget caps',
  'Conflict-free IST session timetable with automatic room capacity healing',
  'Human-in-the-loop (HITL) approval gates before live schedule or budget changes',
  'One-click WhatsApp guest broadcast and downloadable executive run-of-show',
];

export function AuthScreen({
  onLogin,
  existingUser,
}: {
  onLogin: (profile: StoredUserProfile) => void;
  existingUser: StoredUserProfile | null;
}) {
  const [view, setView] = useState<'guide' | 'auth'>('guide');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState(existingUser?.name ?? '');
  const [email, setEmail] = useState(existingUser?.email ?? 'priyam@eventmind.ai');
  const [role, setRole] = useState(existingUser?.role ?? 'Lead Event Architect');
  const [organization, setOrganization] = useState(
    existingUser?.organization ?? 'EventMind India Labs'
  );
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [oauthModalProvider, setOauthModalProvider] = useState<'google' | 'github' | null>(
    null
  );
  const [savedProviderAccounts, setSavedProviderAccounts] = useState<StoredUserProfile[]>([]);
  const [oauthEmail, setOauthEmail] = useState('');
  const [oauthName, setOauthName] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        if (active && Array.isArray(data.providerAccounts)) {
          setSavedProviderAccounts(data.providerAccounts);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      const payload =
        mode === 'login'
          ? { mode: 'login' as const, email, password }
          : { mode: 'register' as const, name, email, password, role, organization };

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        setAuthError(data.error || 'Authentication failed. Check your credentials.');
        setLoading(false);
        return;
      }

      setLoading(false);
      onLogin(data.user as StoredUserProfile);
    } catch {
      setAuthError('Network error while contacting authentication server.');
      setLoading(false);
    }
  };

  const submitProviderAccount = async (
    provider: 'google' | 'github',
    chosenEmail: string,
    chosenName?: string
  ) => {
    if (!chosenEmail.trim()) {
      setAuthError(`Please select or enter a ${provider} email address.`);
      return;
    }

    setAuthError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'oauth',
          provider,
          email: chosenEmail.trim(),
          name: chosenName?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.user) {
        setAuthError(data.error || `Failed to sign in with ${provider}.`);
        setLoading(false);
        return;
      }

      setSavedProviderAccounts((prev) => {
        const filtered = prev.filter(
          (a) => a.email.toLowerCase() !== (data.user as StoredUserProfile).email.toLowerCase()
        );
        return [...filtered, data.user as StoredUserProfile];
      });
      setLoading(false);
      setOauthModalProvider(null);
      onLogin(data.user as StoredUserProfile);
    } catch {
      setAuthError(`Network error during ${provider} sign-in.`);
      setLoading(false);
    }
  };

  const matchingProviderAccounts = savedProviderAccounts.filter(
    (acc) => acc.provider === oauthModalProvider
  );

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-[#f1f5f9] dark:bg-[#060b16] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-cyan-500/15 bg-white/85 dark:bg-[#060b16]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-sm sm:text-base block leading-none">
                EventMind AI
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-teal-700 dark:text-cyan-400">
                Autonomous Event Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setView('guide')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                view === 'guide'
                  ? 'bg-cyan-500/15 text-teal-800 dark:text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => {
                setView('auth');
                setAuthError(null);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/25 transition"
            >
              Login / Register <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {view === 'guide' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 space-y-12">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-[#0d1526] p-7 sm:p-12 shadow-xl"
          >
            <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 text-teal-800 dark:text-cyan-300 border border-cyan-500/25 px-3.5 py-1 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5" /> Purpose, Workflow &amp; Outcomes
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
                What is{' '}
                <span className="bg-gradient-to-r from-cyan-600 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
                  EventMind AI
                </span>{' '}
                and how do you use it?
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                EventMind AI is an autonomous event operations workspace built for conference organizers, corporate teams, and event planners across <strong>105+ Indian cities</strong>. Instead of manually juggling spreadsheets for vendor quotes, 18% GST tax math, room schedules, and live crisis messages, coordinated AI agents execute and audit each stage with manager sign-off.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setView('auth');
                    setMode('login');
                    setAuthError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 text-white font-bold text-sm px-6 py-3.5 shadow-lg shadow-indigo-600/25"
                >
                  Login to Workspace <ArrowRight className="h-4 w-4" />
                </motion.button>
                <button
                  type="button"
                  onClick={() => {
                    setView('auth');
                    setMode('register');
                    setAuthError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold text-sm px-6 py-3.5 hover:border-cyan-500/50 transition"
                >
                  Create Account
                </button>
              </div>
            </div>
          </motion.section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal-700 dark:text-cyan-400 font-bold">
              <Layers className="h-4 w-4" /> How It Works
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {HOW_IT_WORKS_STEPS.map((s, idx) => (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07, duration: 0.35 }}
                  className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-5 shadow-sm"
                >
                  <div className="text-xs font-mono font-extrabold text-teal-700 dark:text-cyan-400">
                    STAGE {s.num}
                  </div>
                  <h3 className="text-base font-bold mt-1">{s.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-7 space-y-4">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm">
                <UserCheck className="h-4 w-4" /> How a Person Uses It
              </div>
              <ol className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>
                  <strong>Sign in or register</strong> with an email &amp; password account, or sign in with a Google / GitHub account.
                </li>
                <li>
                  <strong>Select a city &amp; brief</strong> (e.g., Bengaluru, Lucknow, Prayagraj, Jaipur) and set delegate count, tracks, and budget.
                </li>
                <li>
                  <strong>Run Step-by-Step or Auto-Pilot</strong> to audit 18% GST totals and auto-heal schedule overlaps or capacity breaches.
                </li>
                <li>
                  <strong>Trigger LiveOps emergencies</strong> to generate a ready-to-send WhatsApp broadcast, approve it, and export your ROEI report.
                </li>
              </ol>
            </div>

            <div className="rounded-3xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-7 space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                <Trophy className="h-4 w-4" /> What Outcome You Get
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {OUTCOMES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      ) : (
        <main className="max-w-md mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-3xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-cyan-500/20 p-7 sm:p-8 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setView('guide')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 dark:text-cyan-400 hover:underline"
              >
                <Compass className="h-3.5 w-3.5" /> Read How It Works
              </button>
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight">
              {mode === 'login' ? 'Secure Sign In' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              {mode === 'login'
                ? 'Sign in with your email & password, or demo: priyam@eventmind.ai / EventMind@2026.'
                : 'Register an account with email & password (min 6 chars). Stored in your database.'}
            </p>

            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setAuthError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setAuthError(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Register
              </button>
            </div>

            {authError && !oauthModalProvider && (
              <div className="mb-4 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Priyam Srivastava"
                        className="premium-input !pl-10"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Role
                      </label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="premium-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Organization
                      </label>
                      <div className="relative">
                        <Building2 className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          className="premium-input !pl-9"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="premium-input !pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="premium-input !pl-10 font-mono"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 hover:from-cyan-500 hover:via-indigo-500 hover:to-emerald-500 text-white font-bold text-sm py-3.5 px-5 shadow-lg shadow-indigo-600/25 transition disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Verifying Credentials...
                  </>
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Google / GitHub Account Chooser */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-center text-slate-400">
                Or Continue With
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setAuthError(null);
                    setOauthEmail('');
                    setOauthName('');
                    setOauthModalProvider('google');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-cyan-500/50 py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 transition disabled:opacity-60"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.1.74-2.51 1.18-4.22 1.18-3.25 0-6-2.19-6.98-5.14H1.01v3.14C3.05 21.2 7.24 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.02 14.03c-.25-.74-.39-1.54-.39-2.36 0-.82.14-1.62.39-2.36V6.17H1.01C.37 7.45 0 8.88 0 10.37s.37 2.92 1.01 4.2l4.01-3.14Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.79 0 3.41.62 4.68 1.82l3.51-3.51C18.07 1.19 15.3 0 12 0 7.24 0 3.05 2.8 1.01 6.83l4.01 3.14c.98-2.95 3.73-5.22 6.98-5.22Z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setAuthError(null);
                    setOauthEmail('');
                    setOauthName('');
                    setOauthModalProvider('github');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:border-indigo-500/50 py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 transition disabled:opacity-60"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  GitHub
                </button>
              </div>
            </div>
          </motion.div>
        </main>
      )}

      <AnimatePresence>
        {oauthModalProvider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOauthModalProvider(null)}
            className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-extrabold capitalize">
                    Choose a {oauthModalProvider} Account
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a saved {oauthModalProvider} account or enter your email below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOauthModalProvider(null)}
                  aria-label="Close account chooser"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {authError && (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {matchingProviderAccounts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Saved {oauthModalProvider} Accounts
                  </div>
                  {matchingProviderAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        submitProviderAccount(oauthModalProvider, acc.email, acc.name)
                      }
                      className="w-full flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 hover:border-cyan-500/50 p-3 text-left transition"
                    >
                      <div>
                        <div className="text-sm font-bold">{acc.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {acc.email}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitProviderAccount(oauthModalProvider, oauthEmail, oauthName);
                }}
                className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-cyan-400">
                  <PlusCircle className="h-3.5 w-3.5" /> Use another {oauthModalProvider} account
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    {oauthModalProvider === 'google' ? 'Gmail / Google Email' : 'GitHub Email'}
                  </label>
                  <input
                    type="email"
                    required
                    value={oauthEmail}
                    onChange={(e) => setOauthEmail(e.target.value)}
                    placeholder={
                      oauthModalProvider === 'google'
                        ? 'yourname@gmail.com'
                        : 'yourname@users.noreply.github.com'
                    }
                    className="premium-input"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={oauthName}
                    onChange={(e) => setOauthName(e.target.value)}
                    placeholder="Priyam Srivastava"
                    className="premium-input"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !oauthEmail.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm py-3 shadow-md transition disabled:opacity-60"
                >
                  {loading ? 'Signing in...' : `Continue with ${oauthModalProvider}`}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}