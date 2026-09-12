import React from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, Smartphone, Monitor, Flame, BellOff, Hourglass } from 'lucide-react';
import { FocusIntentRule } from '../types';

interface NavbarProps {
  focusRule: FocusIntentRule | null;
  onOpenIntentModal: () => void;
  viewMode: 'desktop' | 'mobile_sim';
  onToggleViewMode: (mode: 'desktop' | 'mobile_sim') => void;
  blockedCountToday: number;
  productivityScore: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  focusRule,
  onOpenIntentModal,
  viewMode,
  onToggleViewMode,
  blockedCountToday,
  productivityScore
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-200 truncate">
                  FocusShield Agent
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Study Agent
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden lg:block truncate">
                Agentic AI Study-Execution System with Intent-Locked Environment Control
              </p>
            </div>
          </div>

          {/* Center: Live Focus Status / Countdown */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {focusRule && focusRule.isActive ? (
              <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm animate-pulse text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold max-w-[70px] xs:max-w-[100px] sm:max-w-[180px] truncate hidden xs:inline">
                  {focusRule.targetTopic}
                </span>
                <span className="font-mono font-bold bg-emerald-950/80 px-1.5 sm:px-2 py-0.5 rounded-md text-emerald-200 border border-emerald-500/30 text-[11px] sm:text-xs">
                  {formatTime(focusRule.remainingSeconds)}
                </span>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs">
                <Hourglass className="w-3.5 h-3.5 text-slate-500" />
                <span>No active lock</span>
              </div>
            )}

            <button
              onClick={onOpenIntentModal}
              className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 transition-all transform active:scale-95 shrink-0"
              title="Set or modify focus study intent"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span className="hidden sm:inline">{focusRule?.isActive ? 'Edit Focus Intent' : 'Set Focus Intent'}</span>
              <span className="sm:hidden">{focusRule?.isActive ? 'Edit' : 'Intent'}</span>
            </button>
          </div>

          {/* Right: Metrics & View Mode Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Quick Metrics */}
            <div className="hidden lg:flex items-center space-x-4 border-r border-slate-800 pr-4">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Score:</span>
                <span className="font-bold text-amber-400 font-mono">{productivityScore}%</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <BellOff className="w-4 h-4 text-rose-400" />
                <span>Blocked:</span>
                <span className="font-bold text-rose-400 font-mono">{blockedCountToday}</span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700 shrink-0">
              <button
                onClick={() => onToggleViewMode('desktop')}
                title="Full Dashboard Mode"
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'desktop'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                onClick={() => onToggleViewMode('mobile_sim')}
                title="Interactive Mobile Simulator"
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'mobile_sim'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
