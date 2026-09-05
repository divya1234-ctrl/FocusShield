import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Sliders,
  Sparkles,
  Smartphone,
  CheckCircle,
  XCircle,
  AlertOctagon,
  Clock,
  Instagram,
  Youtube,
  Twitter,
  MessageSquare,
  Tv,
  Gamepad2,
  Code,
  FileText,
  GitBranch,
  Brain,
  MessageCircle,
  Layers,
  Zap,
  AlertTriangle
} from 'lucide-react';
import { AppItem, FocusIntentRule } from '../types';
import { playShieldBlockedChime } from '../utils/audio';
import { ExternalYouTubeEnforcerModal } from './ExternalYouTubeEnforcerModal';

interface AppDisablerProps {
  apps: AppItem[];
  focusRule: FocusIntentRule | null;
  onToggleAppBlocked: (appId: string) => void;
  onToggleHardLock: (appId: string) => void;
  onUpdateDailyLimit: (appId: string, minutes: number) => void;
  onUpdateAppUsage?: (appId: string, minutes: number) => void;
  onIncrementAppUsage?: (appId: string, deltaMinutes: number) => void;
  onBatchDisableCategory: (category: string, blocked: boolean) => void;
  onSimulateAppLaunch: (app: AppItem) => void;
}

export const AppDisabler: React.FC<AppDisablerProps> = ({
  apps,
  focusRule,
  onToggleAppBlocked,
  onToggleHardLock,
  onUpdateDailyLimit,
  onUpdateAppUsage,
  onIncrementAppUsage,
  onBatchDisableCategory,
  onSimulateAppLaunch
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEnforcerModal, setShowEnforcerModal] = useState(false);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Youtube':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'Instagram':
        return <Instagram className="w-5 h-5 text-pink-500" />;
      case 'Twitter':
        return <Twitter className="w-5 h-5 text-sky-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-5 h-5 text-orange-500" />;
      case 'Tv':
        return <Tv className="w-5 h-5 text-rose-600" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-amber-500" />;
      case 'Code':
        return <Code className="w-5 h-5 text-amber-400" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-slate-300" />;
      case 'GitBranch':
        return <GitBranch className="w-5 h-5 text-slate-200" />;
      case 'Brain':
        return <Brain className="w-5 h-5 text-blue-400" />;
      case 'MessageCircle':
        return <MessageCircle className="w-5 h-5 text-emerald-400" />;
      default:
        return <Smartphone className="w-5 h-5 text-indigo-400" />;
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesCat = filterCategory === 'all' || app.category === filterCategory;
    const matchesSearch =
      !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const blockedCount = apps.filter((a) => a.isBlocked).length;
  const totalCount = apps.length;

  return (
    <div className="space-y-6">
      {/* Header Info & Batch Presets */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Mobile App Disabler &amp; Shield Controls
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                {blockedCount} / {totalCount} Disabled
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Toggle apps off to block launches, restrict notifications, and enforce hard locks during focus sessions.
            </p>
          </div>

          {/* Quick Batch Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onBatchDisableCategory('social', true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock All Social</span>
            </button>
            <button
              onClick={() => onBatchDisableCategory('gaming', true)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Lock Games</span>
            </button>
            <button
              onClick={() => {
                apps.forEach((a) => {
                  if (a.category !== 'education' && a.category !== 'productivity' && a.category !== 'utility') {
                    if (!a.isBlocked) onToggleAppBlocked(a.id);
                  }
                });
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Deep Study Lockdown</span>
            </button>
            <button
              onClick={() => setShowEnforcerModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Learn how to block external YouTube and phone apps"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Protect External YouTube</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {['all', 'social', 'entertainment', 'gaming', 'education', 'productivity', 'utility'].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[10px] whitespace-nowrap transition-all ${
                    filterCategory === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/90 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter installed apps..."
            className="rounded-xl bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app) => {
          const isLimitExceeded = app.dailyLimitMinutes > 0 && app.usedTodayMinutes >= app.dailyLimitMinutes;
          const isEffectivelyLocked = app.isBlocked || isLimitExceeded;
          const percent = app.dailyLimitMinutes > 0
            ? Math.min(100, Math.round((app.usedTodayMinutes / app.dailyLimitMinutes) * 100))
            : 0;

          return (
            <div
              key={app.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                isEffectivelyLocked
                  ? 'bg-slate-900/60 border-rose-900/40 shadow-inner'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-md'
              }`}
            >
              {/* Top Row: App Icon, Name, Category & Status Toggle */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
                    {getIcon(app.iconName)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                      {app.name}
                      {app.isHardLocked && (
                        <span title="Hard Locked - No bypass without challenge">
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                        </span>
                      )}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium capitalize">
                      {app.category} • {app.usedTodayMinutes}m used today
                    </span>
                  </div>
                </div>

                {/* Main Enable/Disable Toggle & Status Badge */}
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={() => onToggleAppBlocked(app.id)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isEffectivelyLocked ? 'bg-rose-600' : 'bg-slate-700'
                    }`}
                    title={isEffectivelyLocked ? 'App is Locked Out - Click to Toggle Policy' : 'App is Allowed - Click to Deactivate'}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        isEffectivelyLocked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div className="flex flex-col items-end gap-0.5">
                    {isLimitExceeded && (
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-950 text-rose-400 border border-rose-500/50 flex items-center gap-0.5 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>Limit Exceeded</span>
                      </span>
                    )}
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        isEffectivelyLocked
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      {app.isBlocked ? 'Deactivated' : isLimitExceeded ? 'Time Locked' : 'Allowed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-2">
                {app.description}
              </p>

              {/* Daily Quota Slider & Usage Bar */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    Daily Limit:
                  </span>
                  <span className="font-mono font-bold text-slate-200">
                    {app.dailyLimitMinutes} mins
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="180"
                  step="5"
                  value={app.dailyLimitMinutes}
                  onChange={(e) => onUpdateDailyLimit(app.id, parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />

                {/* Live Usage Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {app.usedTodayMinutes}m used
                    </span>
                    <span className={isLimitExceeded ? 'text-rose-400 font-bold font-mono' : 'text-slate-300 font-mono'}>
                      {isLimitExceeded
                        ? `Exceeded by +${app.usedTodayMinutes - app.dailyLimitMinutes}m`
                        : `${Math.max(0, app.dailyLimitMinutes - app.usedTodayMinutes)}m remaining`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isLimitExceeded
                          ? 'bg-rose-500'
                          : percent > 75
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Instant Simulation Tools for testing time limits */}
                <div className="flex items-center justify-between pt-1 text-[10px]">
                  <span className="text-slate-500">Test Time Limit:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onIncrementAppUsage?.(app.id, 5)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] transition"
                      title="Add 5 minutes of usage"
                    >
                      +5m
                    </button>
                    <button
                      onClick={() => onUpdateAppUsage?.(app.id, app.dailyLimitMinutes + 5)}
                      className="px-1.5 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 font-semibold border border-rose-500/40 text-[10px] transition"
                      title="Simulate exceeding the limit right now"
                    >
                      Exceed
                    </button>
                    <button
                      onClick={() => onUpdateAppUsage?.(app.id, 0)}
                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] transition"
                      title="Reset today's usage to 0m"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions: Hard Lock Toggle & Test Launch */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <button
                  onClick={() => onToggleHardLock(app.id)}
                  className={`text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors ${
                    app.isHardLocked
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {app.isHardLocked ? (
                    <>
                      <Lock className="w-3 h-3 text-rose-400" />
                      <span>Hard Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3 h-3 text-slate-500" />
                      <span>Soft Lock</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onSimulateAppLaunch(app)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isEffectivelyLocked
                      ? 'text-rose-400 hover:text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30'
                      : 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30'
                  }`}
                  title={isEffectivelyLocked ? 'Test strict lockout screen' : 'Launch active permitted app'}
                >
                  {isEffectivelyLocked ? (
                    <>
                      <Lock className="w-3 h-3 text-rose-400" />
                      <span>Test Lockout</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3 h-3 text-emerald-400" />
                      <span>Launch App</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* External YouTube Enforcer Modal */}
      <ExternalYouTubeEnforcerModal
        isOpen={showEnforcerModal}
        onClose={() => setShowEnforcerModal(false)}
      />
    </div>
  );
};
