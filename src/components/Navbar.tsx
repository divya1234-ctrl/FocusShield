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
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                  FocusShield
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Guard
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Mobile History &amp; Intent-Locked YouTube Study Engine
              </p>
            </div>
          </div>

          {/* Center: Live Focus Status / Countdown */}
          <div className="flex items-center space-x-2">
            {focusRule && focusRule.isActive ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold max-w-[140px] sm:max-w-[200px] truncate">
                  {focusRule.targetTopic}
                </span>
                <span className="text-xs font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded-md text-emerald-200 border border-emerald-500/30">
                  {formatTime(focusRule.remainingSeconds)}
                </span>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs">
                <Hourglass className="w-3.5 h-3.5 text-slate-500" />
                <span>No active intent lock</span>
              </div>
            )}

            <button
              onClick={onOpenIntentModal}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-md shadow-indigo-500/25 transition-all transform active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{focusRule?.isActive ? 'Edit Focus Intent' : 'Set Focus Intent'}</span>
            </button>
          </div>

          {/* Right: Metrics & View Mode Switcher */}
          <div className="flex items-center space-x-3">
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
            <div className="flex items-center p-0.5 bg-slate-800 rounded-lg border border-slate-700">
              <button
                onClick={() => onToggleViewMode('desktop')}
                title="Full Dashboard Mode"
                className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === 'desktop'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Monitor className="w-4 h-4" />
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
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
