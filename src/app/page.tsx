'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  AgentLog,
  ApprovalGate,
  EventBrief,
  Session,
  VendorQuote,
} from '@/types/blackboard';
import { DEMO_PRESET, VENDOR_CATALOG, ALL_INDIAN_CITIES } from '@/lib/presets';
import { formatINR } from '@/lib/guardrails';
import { RoiResult } from '@/lib/agents/roiMatch';
import { StageBrief } from '@/components/StageBrief';
import { StagePlan } from '@/components/StagePlan';
import { StageLiveOps } from '@/components/StageLiveOps';
import { StageRoi } from '@/components/StageRoi';
import { AgentStream } from '@/components/AgentStream';
import { AuthScreen, StoredUserProfile } from '@/components/AuthScreen';
import {
  Cpu,
  Activity,
  LogOut,
  LayoutDashboard,
  Workflow,
  Store,
  Settings,
  Sun,
  Moon,
  Search,
  ChevronRight,
  UserCheck,
  ArrowUpRight,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';

const USER_STORAGE_KEY = 'eventmind_user_profile_v3';
const THEME_STORAGE_KEY = 'eventmind_theme_v3';

const viewTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
};

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<StoredUserProfile | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [activeMenu, setActiveMenu] = useState<'overview' | 'orchestrator' | 'vendors' | 'settings'>('orchestrator');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorCategory, setVendorCategory] = useState<string>('All');

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
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
    let active = true;
    (async () => {
      try {
        const savedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
        if (savedUserRaw && active) {
          setUserProfile(JSON.parse(savedUserRaw) as StoredUserProfile);
        }

        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        const dark = savedTheme ? savedTheme === 'dark' : true;
        if (active) setIsDark(dark);
        document.documentElement.classList.toggle('dark', dark);

        const res = await fetch('/api/auth', { cache: 'no-store' });
        const data = await res.json();
        if (active) {
          const authed = Boolean(data.authenticated && data.user);
          setIsAuthenticated(authed);
          if (authed && data.user) {
            setUserProfile(data.user as StoredUserProfile);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
          } else {
            localStorage.removeItem(USER_STORAGE_KEY);
          }
        }
      } catch {
        document.documentElement.classList.add('dark');
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const applyTheme = (dark: boolean) => {
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  };

  const handleLogin = (profile: StoredUserProfile) => {
    setUserProfile(profile);
    setIsAuthenticated(true);
    setError(null);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setSavingProfile(true);
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userProfile.name,
          role: userProfile.role,
          organization: userProfile.organization,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        setError(data.error || 'Failed to persist profile changes to server.');
        return;
      }
      const updated = data.user as StoredUserProfile;
      setUserProfile(updated);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      setLogs((prev) => [
        ...prev,
        {
          agent: 'Orchestrator',
          message: `Persisted operator profile for ${updated.name} (${updated.email}).`,
          status: 'success',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        },
      ]);
    } catch {
      setError('Network error while saving profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const resetWorkflow = () => {
    setStep(0);
    setQuotes([]);
    setSessions([]);
    setConflictsResolved(0);
    setLogs([]);
    setRoi(null);
    setApprovalGate(null);
    setAlertMessage(undefined);
    setWhatsappBroadcast(undefined);
    setError(null);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } catch {
      // ignore network error on sign out
    }
    localStorage.removeItem(USER_STORAGE_KEY);
    setMobileMenuOpen(false);
    setIsAuthenticated(false);
    resetWorkflow();
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
      setError(err instanceof Error ? err.message : 'Unexpected system error');
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
      setQuotes(data.quotes ?? []);
      setSessions(data.sessions ?? []);
      setConflictsResolved(data.conflictsResolved ?? 0);
      setApprovalGate(data.approvalGate ?? null);
      setStep(1);
    }
  };

  const handleRunAutoPilot = async (newBrief: EventBrief, autoCrisisLabel?: string) => {
    setBrief(newBrief);
    setLogs([]);
    setAlertMessage(undefined);
    setWhatsappBroadcast(undefined);
    setApprovalGate(null);
    const data = await callApi({
      action: 'autopilot',
      brief: newBrief,
      autoCrisisLabel,
    });
    if (data) {
      setQuotes(data.quotes ?? []);
      setSessions(data.sessions ?? []);
      setConflictsResolved(data.conflictsResolved ?? 0);
      setApprovalGate(data.approvalGate ?? null);
      setAlertMessage(data.alertMessage);
      setWhatsappBroadcast(data.whatsappBroadcast);
      setRoi(data.roi ?? null);
      setStep(data.roi ? 3 : 1);
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
      setSessions(data.sessions ?? sessions);
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
        message: `Operator ${status.toUpperCase()} HITL gate (${approvalGate.agent}).`,
        status: status === 'approved' ? 'success' : 'warning',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
    ]);
  };

  const filteredVendors = VENDOR_CATALOG.filter((v) => {
    const matchesCat = vendorCategory === 'All' || v.category === vendorCategory;
    const q = vendorSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.city.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  if (!hydrated) return null;

  const navItems = [
    { id: 'overview' as const, label: 'How It Works', icon: LayoutDashboard },
    { id: 'orchestrator' as const, label: 'Orchestrator', icon: Workflow },
    { id: 'vendors' as const, label: 'Vendor Catalog', icon: Store },
    { id: 'settings' as const, label: 'Account & Profile', icon: Settings },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full overflow-x-clip bg-[#f1f5f9] dark:bg-[#060b16] text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div
              key="auth-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AuthScreen onLogin={handleLogin} existingUser={userProfile} />
            </motion.div>
          ) : (
            <motion.div
              key="app-shell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex min-h-screen w-full"
            >
              {/* Mobile Drawer */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden"
                  >
                    <motion.aside
                      initial={{ x: -280 }}
                      animate={{ x: 0 }}
                      exit={{ x: -280 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-72 h-full bg-white dark:bg-[#0b1222] border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white">
                              <Cpu className="h-4 w-4" />
                            </div>
                            <span className="font-extrabold text-sm">EventMind AI</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            aria-label="Close menu"
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <nav className="mt-4 space-y-1">
                          {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = activeMenu === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setActiveMenu(item.id);
                                  setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                                  active
                                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                {item.label}
                              </button>
                            );
                          })}
                        </nav>
                      </div>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white py-2.5 text-xs font-bold"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Sign Out
                      </button>
                    </motion.aside>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Desktop Sidebar */}
              <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between bg-white dark:bg-[#0b1222] border-r border-slate-200 dark:border-slate-800/90">
                <div>
                  <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/90">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-600/20">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold tracking-tight leading-none">
                        EventMind AI
                      </div>
                      <div className="text-[10px] font-mono text-teal-700 dark:text-cyan-400 mt-1">
                        {ALL_INDIAN_CITIES.length} INDIAN HUBS
                      </div>
                    </div>
                  </div>

                  <nav className="p-3 space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = activeMenu === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveMenu(item.id)}
                          className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                            active
                              ? 'text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="sidebarActivePill"
                              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                              className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 shadow-md shadow-indigo-600/20"
                            />
                          )}
                          <Icon className="h-4 w-4 relative z-10" />
                          <span className="relative z-10">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-3">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {userProfile?.name ?? 'Operator'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {userProfile?.email}
                    </div>
                    <div className="text-[10px] font-mono text-teal-700 dark:text-cyan-400 mt-1 truncate">
                      {userProfile?.role ?? 'Event Architect'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/25 py-2 text-xs font-bold transition"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sign Out
                  </button>
                </div>
              </aside>

              {/* Main Workspace */}
              <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-[#060b16]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/90 px-4 sm:px-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(true)}
                      aria-label="Open navigation menu"
                      className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <Menu className="h-4 w-4" />
                    </button>

                    <div className="flex items-center text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 min-w-0">
                      <span className="truncate">{userProfile?.organization ?? 'EventMind'}</span>
                      <ChevronRight className="h-4 w-4 mx-1.5 shrink-0 text-slate-400" />
                      <span className="text-slate-900 dark:text-white font-bold capitalize truncate">
                        {activeMenu === 'orchestrator' ? 'Orchestrator' : activeMenu === 'vendors' ? 'Vendor Catalog' : activeMenu === 'settings' ? 'Account & Profile' : 'How It Works'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => applyTheme(!isDark)}
                      aria-label="Toggle color theme"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-cyan-300 hover:border-cyan-500/40 transition"
                    >
                      {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-600" />}
                      <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMenu('settings')}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-teal-500/10 dark:bg-cyan-500/10 text-teal-800 dark:text-cyan-300 border border-teal-500/25 dark:border-cyan-500/25 px-3 py-2 text-xs font-bold hover:bg-teal-500/15 transition"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      {userProfile?.name?.split(' ')[0] ?? 'Account'}
                    </button>
                  </div>
                </header>

                <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
                  <AnimatePresence mode="wait">
                    {activeMenu === 'overview' && (
                      <motion.div key="tab-overview" {...viewTransition} className="space-y-6">
                        <div className="rounded-3xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 p-6 sm:p-8 text-white shadow-xl">
                          <div className="text-xs font-mono uppercase tracking-widest text-cyan-100">
                            Purpose, Usage &amp; Outcomes • {userProfile?.name}
                          </div>
                          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
                            {brief.title}
                          </h1>
                          <p className="text-sm text-cyan-50/95 mt-2 max-w-2xl leading-relaxed">
                            Built to plan events across <strong>{ALL_INDIAN_CITIES.length} Indian cities</strong> with 18% GST tax ledgers, conflict-free IST agendas, LiveOps crisis re-routing, and ROEI pipeline reports.
                          </p>
                          <button
                            type="button"
                            onClick={() => setActiveMenu('orchestrator')}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white text-slate-950 font-bold text-xs sm:text-sm px-4 py-2.5 shadow hover:bg-cyan-50 transition"
                          >
                            Open Orchestrator <ArrowUpRight className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-5">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Supported Indian Cities
                            </div>
                            <div className="text-2xl font-extrabold text-teal-700 dark:text-cyan-400 mt-1">
                              {ALL_INDIAN_CITIES.length} Hubs
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-5">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Active Budget Cap
                            </div>
                            <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
                              {formatINR(brief.budget)}
                            </div>
                          </div>
                          <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-5">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Workflow Progress
                            </div>
                            <div className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">
                              Step 0{step + 1} / 04
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeMenu === 'orchestrator' && (
                      <motion.div
                        key="tab-orchestrator"
                        {...viewTransition}
                        className="flex flex-col lg:flex-row gap-6 items-start"
                      >
                        <div className="flex-1 min-w-0 w-full space-y-5">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-2 shadow-sm">
                            {['Configure', 'Audit & Plan', 'Live Ops', 'ROEI'].map((label, idx) => {
                              const isCurrent = step === idx;
                              const isDone = step > idx;
                              return (
                                <button
                                  key={label}
                                  type="button"
                                  disabled={!isDone && !isCurrent}
                                  onClick={() => (isDone || isCurrent) && setStep(idx)}
                                  className={`relative rounded-xl py-2.5 px-2 text-center transition-colors ${
                                    isCurrent
                                      ? 'text-white'
                                      : isDone
                                      ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/15'
                                      : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                  }`}
                                >
                                  {isCurrent && (
                                    <motion.span
                                      layoutId="stepActivePill"
                                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 shadow-md shadow-indigo-600/20"
                                    />
                                  )}
                                  <div className="relative z-10 text-[10px] font-mono uppercase tracking-widest opacity-85">
                                    0{idx + 1}
                                  </div>
                                  <div className="relative z-10 text-xs font-bold truncate mt-0.5">{label}</div>
                                </button>
                              );
                            })}
                          </div>

                          {error && (
                            <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-4 text-xs sm:text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                              <Activity className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>{error}</span>
                            </div>
                          )}

                          <AnimatePresence mode="wait">
                            {step === 0 && (
                              <motion.div key="stage-0" {...viewTransition}>
                                <StageBrief
                                  initialBrief={brief}
                                  loading={loading}
                                  onRunPlan={handleRunPlan}
                                  onRunAutoPilot={handleRunAutoPilot}
                                />
                              </motion.div>
                            )}
                            {step === 1 && (
                              <motion.div key="stage-1" {...viewTransition}>
                                <StagePlan
                                  quotes={quotes}
                                  sessions={sessions}
                                  conflictsResolved={conflictsResolved}
                                  budget={brief.budget}
                                  includeGst={brief.includeGst}
                                  approvalGate={approvalGate}
                                  onApproveGate={(id) => handleGateDecision(id, 'approved')}
                                  onRejectGate={(id) => handleGateDecision(id, 'rejected')}
                                  onNext={() => setStep(2)}
                                />
                              </motion.div>
                            )}
                            {step === 2 && (
                              <motion.div key="stage-2" {...viewTransition}>
                                <StageLiveOps
                                  city={brief.city}
                                  sessions={sessions}
                                  alertMessage={alertMessage}
                                  whatsappBroadcast={whatsappBroadcast}
                                  approvalGate={approvalGate}
                                  loading={loading}
                                  onApproveGate={(id: string) => handleGateDecision(id, 'approved')}
                                  onRejectGate={(id: string) => handleGateDecision(id, 'rejected')}
                                  onTriggerCrisis={handleCrisis}
                                  onComputeRoi={handleComputeRoi}
                                />
                              </motion.div>
                            )}
                            {step === 3 && roi && (
                              <motion.div key="stage-3" {...viewTransition}>
                                <StageRoi
                                  brief={brief}
                                  quotes={quotes}
                                  sessions={sessions}
                                  roi={roi}
                                  onReset={resetWorkflow}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="w-full lg:w-[390px] shrink-0">
                          <AgentStream logs={logs} />
                        </div>
                      </motion.div>
                    )}

                    {activeMenu === 'vendors' && (
                      <motion.div key="tab-vendors" {...viewTransition} className="space-y-5">
                        <div className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                            <div>
                              <h2 className="text-lg font-bold">Verified Indian Vendor Catalog</h2>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Filter venues, catering, and AV partners by category or city.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {['All', 'Venue', 'Catering', 'AV & Production'].map((cat) => (
                                <button
                                  key={cat}
                                  type="button"
                                  onClick={() => setVendorCategory(cat)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    vendorCategory === cat
                                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                                  }`}
                                >
                                  {cat}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative mb-5">
                            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                              value={vendorSearch}
                              onChange={(e) => setVendorSearch(e.target.value)}
                              placeholder="Search vendor or city..."
                              className="premium-input !pl-10"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredVendors.slice(0, 24).map((v, idx) => (
                              <div
                                key={`${v.name}-${idx}`}
                                className="rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 p-4"
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className="rounded-md bg-cyan-500/10 text-teal-800 dark:text-cyan-300 px-2 py-0.5 text-[10px] font-bold uppercase">
                                    {v.category}
                                  </span>
                                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    {v.city}
                                  </span>
                                </div>
                                <div className="text-sm font-bold">{v.name}</div>
                                {typeof v.baseCost === 'number' && (
                                  <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold mt-2">
                                    Est. {formatINR(v.baseCost)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeMenu === 'settings' && userProfile && (
                      <motion.div key="tab-settings" {...viewTransition} className="max-w-2xl">
                        <form
                          onSubmit={handleSaveProfile}
                          className="rounded-2xl bg-white dark:bg-[#0d1526] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <h2 className="text-lg font-bold">Stored Account Details</h2>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                ID: <span className="font-mono">{userProfile.id}</span> • Last login: {userProfile.lastLogin}
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-3 py-1 text-xs font-bold">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Verified Session
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                                Full Name
                              </label>
                              <input
                                value={userProfile.name}
                                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                                className="premium-input"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                                Email
                              </label>
                              <input
                                type="email"
                                readOnly
                                value={userProfile.email}
                                className="premium-input opacity-75 cursor-not-allowed"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                                Role
                              </label>
                              <input
                                value={userProfile.role}
                                onChange={(e) => setUserProfile({ ...userProfile, role: e.target.value })}
                                className="premium-input"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                                Organization
                              </label>
                              <input
                                value={userProfile.organization}
                                onChange={(e) =>
                                  setUserProfile({ ...userProfile, organization: e.target.value })
                                }
                                className="premium-input"
                              />
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={savingProfile}
                            className="rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm px-5 py-3 shadow-md shadow-indigo-600/20 transition disabled:opacity-60"
                          >
                            {savingProfile ? 'Saving to Database...' : 'Save Profile Details'}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </main>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}