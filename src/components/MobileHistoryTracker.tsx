import React, { useState } from 'react';
import {
  Clock,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Flame,
  Sparkles,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Filter,
  CheckCircle,
  XCircle,
  Plus,
  Play,
  RotateCcw
} from 'lucide-react';
import { HistoryEvent, DailyUsageStat, AIProductivityInsight } from '../types';

interface MobileHistoryTrackerProps {
  events: HistoryEvent[];
  dailyStats: DailyUsageStat[];
  productivityScore: number;
  onSimulateEvent: (type: HistoryEvent['type'], title: string, details: string, appName?: string) => void;
  onClearHistory: () => void;
}

export const MobileHistoryTracker: React.FC<MobileHistoryTrackerProps> = ({
  events,
  dailyStats,
  productivityScore,
  onSimulateEvent,
  onClearHistory
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [aiInsight, setAiInsight] = useState<AIProductivityInsight | null>(null);

  const todayStat = dailyStats[dailyStats.length - 1] || {
    totalScreenTimeMinutes: 142,
    focusTimeMinutes: 105,
    pickups: 26,
    blockedAttempts: 14
  };

  const filteredEvents = events.filter((ev) => {
    if (filterType === 'all') return true;
    if (filterType === 'blocked') return ev.status === 'intercepted';
    if (filterType === 'video') return ev.type === 'video_watched' || ev.type === 'video_blocked';
    if (filterType === 'focus') return ev.type === 'focus_started' || ev.type === 'focus_completed';
    if (filterType === 'apps') return ev.type === 'app_launch' || ev.type === 'app_blocked';
    return true;
  });

  const handleFetchAiInsights = async () => {
    setIsGeneratingInsights(true);
    try {
      const res = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historySummary: todayStat,
          blockedAttempts: events.filter((e) => e.status === 'intercepted').slice(0, 5),
          activeApps: ['Instagram (Locked)', 'TikTok (Locked)', 'YouTube DSA Only'],
          focusSessions: 3
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiInsight(data);
      }
    } catch (err) {
      console.error('Error fetching AI insights:', err);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Summary Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Screen Time */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Screen Time Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white font-mono">
              {Math.floor(todayStat.totalScreenTimeMinutes / 60)}h {todayStat.totalScreenTimeMinutes % 60}m
            </span>
            <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              -28% vs yesterday
            </p>
          </div>
        </div>

        {/* Deep Focus Time */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              DSA Focus Time
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              {Math.floor(todayStat.focusTimeMinutes / 60)}h {todayStat.focusTimeMinutes % 60}m
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              74% of total phone time
            </p>
          </div>
        </div>

        {/* Distractions Intercepted */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Distractions Blocked
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-rose-400 font-mono">
              {todayStat.blockedAttempts}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              YouTube + Social app attempts
            </p>
          </div>
        </div>

        {/* Device Pickups */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Phone Pickups
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-amber-400 font-mono">
              {todayStat.pickups}
            </span>
            <p className="text-[11px] text-emerald-400 mt-1">
              Low impulsivity index
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Screen Time Trends Bar Chart */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              7-Day Mobile History &amp; Focus Velocity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison between Deep Focus Study Time and General Mobile Usage
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-slate-700 inline-block" />
              General
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              DSA Focus
            </span>
          </div>
        </div>

        {/* CSS Scaled Bar Chart */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 items-end h-44">
          {dailyStats.map((stat, idx) => {
            const maxMins = 260;
            const focusHeight = Math.round((stat.focusTimeMinutes / maxMins) * 100);
            const otherHeight = Math.round(
              ((stat.totalScreenTimeMinutes - stat.focusTimeMinutes) / maxMins) * 100
            );

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                  {Math.floor(stat.totalScreenTimeMinutes / 60)}h{stat.totalScreenTimeMinutes % 60}m
                </div>
                <div className="w-full max-w-[36px] flex flex-col justify-end bg-slate-800/60 rounded-t-lg overflow-hidden h-32 p-0.5">
                  <div
                    style={{ height: `${otherHeight}%` }}
                    className="w-full bg-slate-700 rounded-sm mb-0.5 transition-all"
                    title={`General Time: ${stat.totalScreenTimeMinutes - stat.focusTimeMinutes}m`}
                  />
                  <div
                    style={{ height: `${focusHeight}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-sm transition-all"
                    title={`Focus Study Time: ${stat.focusTimeMinutes}m`}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-300 mt-2 font-mono">
                  {stat.dayLabel}
                </span>
                <span className="text-[10px] text-rose-400 font-mono">
                  {stat.blockedAttempts} blk
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Productivity & Habit Coach Panel */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                Gemini AI Digital Discipline Coach
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  Adaptive
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Synthesizes your real-time mobile logs into actionable focus habits
              </p>
            </div>
          </div>

          <button
            onClick={handleFetchAiInsights}
            disabled={isGeneratingInsights}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-2 transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGeneratingInsights ? 'Analyzing Telemetry...' : 'Refresh AI Coaching'}</span>
          </button>
        </div>

        {aiInsight ? (
          <div className="space-y-4 pt-2 border-t border-slate-800/80 animate-in fade-in">
            <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              &ldquo;{aiInsight.executiveSummary}&rdquo;
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Key Observations
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {aiInsight.keyObservations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Actionable Advice for Tomorrow
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {aiInsight.actionableAdvice.map((adv, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{adv}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>
              Click <strong>&quot;Refresh AI Coaching&quot;</strong> to evaluate your latest DSA session and phone pickup patterns.
            </span>
          </div>
        )}
      </div>

      {/* Interactive Timeline of Mobile Events */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Live Mobile Activity &amp; Distraction Timeline
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of phone unlocks, app launches, and intercepted videos
            </p>
          </div>

          {/* Timeline Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Logs' },
              { id: 'blocked', label: 'Blocked Only' },
              { id: 'video', label: 'YouTube' },
              { id: 'apps', label: 'Apps' },
              { id: 'focus', label: 'Focus Sessions' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                  filterType === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Simulation Bar (To test creating new logs) */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium">Simulate Phone Interaction:</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                onSimulateEvent(
                  'phone_pickup',
                  `Phone Pickup #${todayStat.pickups + 1}`,
                  'Checked lock screen clock & notifications.'
                )
              }
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1"
            >
              <Smartphone className="w-3 h-3 text-amber-400" />
              + Phone Pickup
            </button>
            <button
              onClick={() =>
                onSimulateEvent(
                  'app_blocked',
                  'Instagram Launch Blocked',
                  'Hard Lock intercepted background notification click.',
                  'Instagram'
                )
              }
              className="px-2.5 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-900/40 text-[11px] font-medium flex items-center gap-1"
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              + Trigger Blocked App
            </button>
            <button
              onClick={() =>
                onSimulateEvent(
                  'video_watched',
                  'Solved LeetCode 206 (Reverse Linked List)',
                  'Completed 20 mins of algorithmic coding tutorial.',
                  'YouTube'
                )
              }
              className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-900/40 text-[11px] font-medium flex items-center gap-1"
            >
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              + DSA Watch Session
            </button>
          </div>
        </div>

        {/* Timeline Items */}
        <div className="space-y-3 pt-2">
          {filteredEvents.map((ev) => {
            const isBlocked = ev.status === 'intercepted';
            const isAllowed = ev.status === 'allowed';

            return (
              <div
                key={ev.id}
                className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-all ${
                  isBlocked
                    ? 'bg-rose-950/20 border-rose-900/40 text-slate-200'
                    : isAllowed
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                }`}
              >
                {/* Status Icon */}
                <div className="mt-0.5">
                  {isBlocked ? (
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  ) : isAllowed ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <Clock className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white">{ev.title}</span>
                      {ev.appName && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {ev.appName}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{ev.timeString}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{ev.details}</p>
                </div>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              No activity logs match the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
