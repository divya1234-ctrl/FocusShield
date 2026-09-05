import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Youtube,
  Smartphone,
  BarChart3,
  Sparkles,
  Lock,
  Layers,
  Clock,
  Flame,
  CheckCircle,
  Play,
  RotateCcw,
  Zap,
  BookOpen,
  Globe,
  Eye
} from 'lucide-react';
import {
  AppItem,
  VideoItem,
  FocusIntentRule,
  HistoryEvent,
  DailyUsageStat,
  MonitoredTabRule
} from './types';
import {
  INITIAL_APPS,
  INITIAL_VIDEOS,
  INITIAL_FOCUS_RULE,
  INITIAL_HISTORY_EVENTS,
  INITIAL_DAILY_STATS,
  INITIAL_TAB_RULES
} from './data/mockMobileData';
import { Navbar } from './components/Navbar';
import { IntentLockModal } from './components/IntentLockModal';
import { YouTubeFocusShield } from './components/YouTubeFocusShield';
import { AppDisabler } from './components/AppDisabler';
import { MobileHistoryTracker } from './components/MobileHistoryTracker';
import { MobilePhoneSimulator } from './components/MobilePhoneSimulator';
import { TabGuardian } from './components/TabGuardian';
import { UnauthorizedTabModal } from './components/UnauthorizedTabModal';
import { playSuccessChime, playShieldBlockedChime } from './utils/audio';

export default function App() {
  const [focusRule, setFocusRule] = useState<FocusIntentRule | null>(INITIAL_FOCUS_RULE);
  const [apps, setApps] = useState<AppItem[]>(INITIAL_APPS);
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [tabRules, setTabRules] = useState<MonitoredTabRule[]>(INITIAL_TAB_RULES);
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>(INITIAL_HISTORY_EVENTS);
  const [dailyStats, setDailyStats] = useState<DailyUsageStat[]>(INITIAL_DAILY_STATS);
  const [activeTab, setActiveTab] = useState<'youtube' | 'tabs' | 'apps' | 'history' | 'simulator'>('youtube');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile_sim'>('desktop');
  const [isIntentModalOpen, setIsIntentModalOpen] = useState(false);

  // Tab switch violation tracking state
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(3);
  const [timeAwaySeconds, setTimeAwaySeconds] = useState<number>(42);
  const [showUnauthorizedTabModal, setShowUnauthorizedTabModal] = useState<boolean>(false);
  const [currentAwaySeconds, setCurrentAwaySeconds] = useState<number>(0);

  // Global Page Visibility & Tab Switch Sentinel:
  // Detects when the user switches away from FocusShield to another browser tab or window
  useEffect(() => {
    let leaveTimestamp: number | null = null;
    const originalTitle = document.title;
    let flashInterval: ReturnType<typeof setInterval> | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away to another browser tab or minimized the window
        leaveTimestamp = Date.now();
        playShieldBlockedChime();

        // Flash emergency alert in tab title
        let flag = false;
        flashInterval = setInterval(() => {
          document.title = flag
            ? '🚨 UNAUTHORIZED TAB ACTIVE!'
            : '⚠️ FOCUS SESSION LOCKED - RETURN!';
          flag = !flag;
        }, 1000);
      } else {
        // User returned to FocusShield!
        if (flashInterval) {
          clearInterval(flashInterval);
          flashInterval = null;
        }
        document.title = originalTitle;

        if (leaveTimestamp) {
          const elapsedSeconds = Math.max(1, Math.round((Date.now() - leaveTimestamp) / 1000));
          leaveTimestamp = null;

          // If they were away for 2 or more seconds, trigger interception modal & record violation!
          if (elapsedSeconds >= 2) {
            setTabSwitchCount((c) => c + 1);
            setTimeAwaySeconds((t) => t + elapsedSeconds);
            setCurrentAwaySeconds(elapsedSeconds);
            setShowUnauthorizedTabModal(true);
            playShieldBlockedChime();

            const violationEvent: HistoryEvent = {
              id: `hist-tab-${Date.now()}`,
              timestamp: new Date().toISOString(),
              timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              type: 'unauthorized_tab_switch',
              title: `Unauthorized Tab Switch Detected (${elapsedSeconds}s away)`,
              details: `User navigated away to an unmonitored or unallowed browser tab during active study session on ${focusRule?.targetTopic || 'Algorithms'}.`,
              category: 'social',
              status: 'intercepted',
              penaltyScore: 15
            };
            setHistoryEvents((h) => [violationEvent, ...h]);

            // Update daily stats
            setDailyStats((prev) => {
              const copy = [...prev];
              const last = { ...copy[copy.length - 1] };
              last.blockedAttempts += 1;
              copy[copy.length - 1] = last;
              return copy;
            });
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (flashInterval) clearInterval(flashInterval);
    };
  }, [focusRule?.targetTopic]);

  // Focus Timer Countdown Effect
  useEffect(() => {
    if (!focusRule || !focusRule.isActive || focusRule.isPaused) return;

    const interval = setInterval(() => {
      setFocusRule((prev) => {
        if (!prev || !prev.isActive || prev.isPaused) return prev;
        if (prev.remainingSeconds <= 1) {
          playSuccessChime();
          // Log completion in history
          const completionEvent: HistoryEvent = {
            id: `hist-comp-${Date.now()}`,
            timestamp: new Date().toISOString(),
            timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'focus_completed',
            title: `Completed ${prev.targetTopic} Session`,
            details: `Successfully completed ${prev.durationMinutes} minutes of distraction-free algorithmic study.`,
            category: 'focus_system',
            status: 'completed'
          };
          setHistoryEvents((h) => [completionEvent, ...h]);

          return {
            ...prev,
            remainingSeconds: 0,
            isActive: false,
            isCompleted: true
          };
        }
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [focusRule?.isActive, focusRule?.isPaused]);

  // Handler: When a video is watched
  const handleVideoWatched = (video: VideoItem) => {
    const newEvent: HistoryEvent = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'video_watched',
      title: `Watched ${video.category.toUpperCase()}: ${video.title}`,
      details: `Watched ${video.duration} tutorial from ${video.channelTitle}. Verified match with active DSA focus rule.`,
      category: 'education',
      appName: 'YouTube',
      durationMinutes: 25,
      status: 'allowed'
    };

    setHistoryEvents((prev) => [newEvent, ...prev]);

    if (focusRule && focusRule.isActive) {
      setFocusRule((prev) =>
        prev
          ? {
              ...prev,
              videosWatchedCount: prev.videosWatchedCount + 1
            }
          : null
      );
    }
  };

  // Handler: When a distraction is blocked
  const handleDistractionBlocked = (video: VideoItem, reason: string) => {
    const newEvent: HistoryEvent = {
      id: `hist-blk-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'video_blocked',
      title: `YouTube Video Intercepted: "${video.title}"`,
      details: reason,
      category: 'entertainment',
      appName: 'YouTube',
      status: 'intercepted',
      penaltyScore: 10
    };

    setHistoryEvents((prev) => [newEvent, ...prev]);

    // Update stats
    setDailyStats((prev) => {
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.blockedAttempts += 1;
      copy[copy.length - 1] = last;
      return copy;
    });

    if (focusRule && focusRule.isActive) {
      setFocusRule((prev) =>
        prev
          ? {
              ...prev,
              distractionsBlockedCount: prev.distractionsBlockedCount + 1
            }
          : null
      );
    }
  };

  // Handler: Add custom verified video
  const handleAddCustomVideo = (video: VideoItem) => {
    setVideos((prev) => [video, ...prev]);
  };

  // Handler: Toggle App Blocked
  const handleToggleAppBlocked = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, isBlocked: !a.isBlocked } : a))
    );
  };

  // Handler: Toggle App Hard Lock
  const handleToggleHardLock = (appId: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, isHardLocked: !a.isHardLocked } : a))
    );
  };

  // Handler: Update Daily Limit
  const handleUpdateDailyLimit = (appId: string, minutes: number) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const newLimit = Math.max(0, minutes);
        return {
          ...a,
          dailyLimitMinutes: newLimit
        };
      })
    );
  };

  // Handler: Update / Set App Usage directly (e.g. reset or simulate)
  const handleUpdateAppUsage = (appId: string, usedMinutes: number) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        return {
          ...a,
          usedTodayMinutes: Math.max(0, usedMinutes)
        };
      })
    );
  };

  // Handler: Increment App Usage (e.g. as user watches videos or runs apps)
  const handleIncrementAppUsage = (appId: string, deltaMinutes: number) => {
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        return {
          ...a,
          usedTodayMinutes: Math.max(0, a.usedTodayMinutes + deltaMinutes)
        };
      })
    );
  };

  // Handler: Batch Disable Category
  const handleBatchDisableCategory = (category: string, blocked: boolean) => {
    setApps((prev) =>
      prev.map((a) => (a.category === category ? { ...a, isBlocked: blocked } : a))
    );
  };

  // Handler: Simulate App Launch
  const handleSimulateAppLaunch = (app: AppItem) => {
    if (app.isBlocked) {
      playShieldBlockedChime();
      const newEvent: HistoryEvent = {
        id: `hist-app-blk-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'app_blocked',
        title: `${app.name} Launch Intercepted`,
        details: `App is disabled by FocusShield policy (${app.category}). Distraction prevented.`,
        category: app.category,
        appName: app.name,
        status: 'intercepted',
        penaltyScore: 15
      };
      setHistoryEvents((prev) => [newEvent, ...prev]);
      alert(`🛡️ FocusShield Blocked ${app.name}!\n\nThis app is currently disabled to protect your focus on ${focusRule?.targetTopic || 'DSA'}.`);
    } else {
      const newEvent: HistoryEvent = {
        id: `hist-app-open-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'app_launch',
        title: `Opened ${app.name}`,
        details: `User launched ${app.name} (${app.category}). Permitted application.`,
        category: app.category,
        appName: app.name,
        durationMinutes: 15,
        status: 'allowed'
      };
      setHistoryEvents((prev) => [newEvent, ...prev]);
      alert(`✓ ${app.name} Opened.\n\nPermitted in your current schedule.`);
    }
  };

  // Handler: Simulate Generic Event
  const handleSimulateEvent = (
    type: HistoryEvent['type'],
    title: string,
    details: string,
    appName?: string
  ) => {
    const newEvent: HistoryEvent = {
      id: `hist-sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type,
      title,
      details,
      category: 'utility',
      appName,
      status: type === 'app_blocked' ? 'intercepted' : 'allowed'
    };
    setHistoryEvents((prev) => [newEvent, ...prev]);

    if (type === 'phone_pickup') {
      setDailyStats((prev) => {
        const copy = [...prev];
        const last = { ...copy[copy.length - 1] };
        last.pickups += 1;
        copy[copy.length - 1] = last;
        return copy;
      });
    }
  };

  // Apply new Intent Rule
  const handleApplyRule = (rule: FocusIntentRule) => {
    setFocusRule(rule);
    if (rule.targetPlatform === 'all_apps') {
      // Disable all social and entertainment apps
      setApps((prev) =>
        prev.map((a) =>
          a.category === 'social' || a.category === 'entertainment' || a.category === 'gaming'
            ? { ...a, isBlocked: true }
            : a
        )
      );
    }
    const startEvent: HistoryEvent = {
      id: `hist-rule-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'focus_started',
      title: `Intent Lock Engaged: ${rule.targetTopic}`,
      details: rule.ruleSummary,
      category: 'focus_system',
      status: 'info'
    };
    setHistoryEvents((prev) => [startEvent, ...prev]);
  };

  // Handler: Add Tab Rule
  const handleAddTabRule = (newRule: Omit<MonitoredTabRule, 'id' | 'blockedCount'>) => {
    const ruleItem: MonitoredTabRule = {
      ...newRule,
      id: `tab-${Date.now()}`,
      blockedCount: 0
    };
    setTabRules((prev) => [ruleItem, ...prev]);

    const logEv: HistoryEvent = {
      id: `hist-tabrule-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'search_performed',
      title: `Configured Tab Policy: ${newRule.title}`,
      details: `Added ${newRule.domain} to ${newRule.category === 'allowed' ? 'Allowed Whitelist' : 'Disallowed Blacklist'}.`,
      category: 'productivity',
      status: 'info'
    };
    setHistoryEvents((h) => [logEv, ...h]);
  };

  // Handler: Toggle Tab Category (Allowed <-> Disallowed)
  const handleToggleTabCategory = (tabId: string) => {
    setTabRules((prev) =>
      prev.map((r) => {
        if (r.id !== tabId) return r;
        const newCat = r.category === 'allowed' ? 'disallowed' : 'allowed';
        return {
          ...r,
          category: newCat
        };
      })
    );
  };

  // Handler: Delete Tab Rule
  const handleDeleteTabRule = (tabId: string) => {
    setTabRules((prev) => prev.filter((r) => r.id !== tabId));
  };

  // Handler: Simulate Tab Violation (Test intercept)
  const handleSimulateTabViolation = (domain: string, title: string) => {
    playShieldBlockedChime();
    setTabSwitchCount((c) => c + 1);
    setTimeAwaySeconds((t) => t + 25);
    setCurrentAwaySeconds(25);
    setShowUnauthorizedTabModal(true);

    const violationEvent: HistoryEvent = {
      id: `hist-sim-tab-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'tab_violation_blocked',
      title: `Unallowed Tab Blocked: ${title} (${domain})`,
      details: `User attempted to browse unallowed tab "${domain}" during active focus session. Access intercepted.`,
      category: 'social',
      status: 'intercepted',
      penaltyScore: 15
    };
    setHistoryEvents((h) => [violationEvent, ...h]);

    setDailyStats((prev) => {
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.blockedAttempts += 1;
      copy[copy.length - 1] = last;
      return copy;
    });
  };

  // Handler: Whitelist Tab from Interception Modal
  const handleWhitelistTab = (domain: string, title: string) => {
    handleAddTabRule({
      domain,
      title,
      category: 'allowed',
      description: 'Manually verified permitted study tab',
      matchPattern: domain
    });
  };

  // Handler: Confirm Distraction from Modal
  const handleConfirmDistraction = (reason: string) => {
    playShieldBlockedChime();
    const newEvent: HistoryEvent = {
      id: `hist-ack-distract-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'unauthorized_tab_switch',
      title: `Acknowledged Tab Distraction`,
      details: reason,
      category: 'social',
      status: 'intercepted',
      penaltyScore: 10
    };
    setHistoryEvents((h) => [newEvent, ...h]);
  };

  // Stable callback for videos fetched by YouTubeFocusShield
  const handleVideosFetched = useCallback((newVideos: VideoItem[]) => {
    setVideos((prev) => {
      if (prev === newVideos) return prev;
      if (prev.length === newVideos.length && prev[0]?.id === newVideos[0]?.id) return prev;
      return newVideos;
    });
  }, []);

  const blockedCountToday = dailyStats[dailyStats.length - 1]?.blockedAttempts || 14;
  const productivityScore = 92;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        focusRule={focusRule}
        onOpenIntentModal={() => setIsIntentModalOpen(true)}
        viewMode={viewMode}
        onToggleViewMode={(m) => setViewMode(m)}
        blockedCountToday={blockedCountToday}
        productivityScore={productivityScore}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* If Mobile Simulator View is selected */}
        {viewMode === 'mobile_sim' ? (
          <div className="flex flex-col items-center justify-center">
            <div className="text-center max-w-md mb-2">
              <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                Live Interactive Smartphone Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Interact with the mobile YouTube feed, tap blocked apps to test policy enforcement, and search DSA problems.
              </p>
            </div>
            <MobilePhoneSimulator
              apps={apps}
              videos={videos}
              focusRule={focusRule}
              events={historyEvents}
              onVideoWatched={handleVideoWatched}
              onDistractionBlocked={handleDistractionBlocked}
              onAppBlockedAttempt={handleSimulateAppLaunch}
            />
          </div>
        ) : (
          /* Desktop Studio View */
          <div className="space-y-6">
            {/* Primary Tab Navigation */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveTab('youtube')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === 'youtube'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Youtube className="w-4 h-4 text-red-400" />
                  <span>YouTube Intent Focus Feed</span>
                  {focusRule?.isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('tabs')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === 'tabs'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Globe className="w-4 h-4 text-indigo-400" />
                  <span>Tab Guardian &amp; Sentinel</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-rose-300 font-mono">
                    {tabRules.filter((r) => r.category === 'disallowed').length} blocked
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('apps')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === 'apps'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  <span>App Disabler &amp; Lockouts</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 font-mono">
                    {apps.filter((a) => a.isBlocked).length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                    activeTab === 'history'
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                      : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Mobile Screen History &amp; Logs</span>
                </button>
              </div>

              {/* Quick Intent Trigger */}
              <button
                onClick={() => setIsIntentModalOpen(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Prompt New Goal</span>
              </button>
            </div>

            {/* Tab Views */}
            {activeTab === 'youtube' && (
              <YouTubeFocusShield
                videos={videos}
                focusRule={focusRule}
                apps={apps}
                onToggleAppBlocked={handleToggleAppBlocked}
                onNavigateToDisabler={() => setActiveTab('apps')}
                onUpdateAppUsage={handleUpdateAppUsage}
                onIncrementAppUsage={handleIncrementAppUsage}
                onUpdateDailyLimit={handleUpdateDailyLimit}
                onVideoWatched={handleVideoWatched}
                onDistractionBlocked={handleDistractionBlocked}
                onAddCustomVideo={handleAddCustomVideo}
                onVideosFetched={handleVideosFetched}
              />
            )}

            {activeTab === 'tabs' && (
              <TabGuardian
                tabRules={tabRules}
                focusRule={focusRule}
                onAddTabRule={handleAddTabRule}
                onToggleTabCategory={handleToggleTabCategory}
                onDeleteTabRule={handleDeleteTabRule}
                tabSwitchCount={tabSwitchCount}
                timeAwaySeconds={timeAwaySeconds}
                onSimulateTabViolation={handleSimulateTabViolation}
              />
            )}

            {activeTab === 'apps' && (
              <AppDisabler
                apps={apps}
                focusRule={focusRule}
                onToggleAppBlocked={handleToggleAppBlocked}
                onToggleHardLock={handleToggleHardLock}
                onUpdateDailyLimit={handleUpdateDailyLimit}
                onUpdateAppUsage={handleUpdateAppUsage}
                onIncrementAppUsage={handleIncrementAppUsage}
                onBatchDisableCategory={handleBatchDisableCategory}
                onSimulateAppLaunch={handleSimulateAppLaunch}
              />
            )}

            {activeTab === 'history' && (
              <MobileHistoryTracker
                events={historyEvents}
                dailyStats={dailyStats}
                productivityScore={productivityScore}
                onSimulateEvent={handleSimulateEvent}
                onClearHistory={() => setHistoryEvents([])}
              />
            )}
          </div>
        )}
      </main>

      {/* Intent Configuration Modal */}
      <IntentLockModal
        isOpen={isIntentModalOpen}
        onClose={() => setIsIntentModalOpen(false)}
        currentRule={focusRule}
        onApplyRule={handleApplyRule}
      />

      {/* Unauthorized Tab Interception Modal */}
      <UnauthorizedTabModal
        isOpen={showUnauthorizedTabModal}
        onClose={() => setShowUnauthorizedTabModal(false)}
        secondsAway={currentAwaySeconds}
        focusRule={focusRule}
        onWhitelistTab={handleWhitelistTab}
        onConfirmDistraction={handleConfirmDistraction}
        onNavigateToTabGuardian={() => setActiveTab('tabs')}
      />
    </div>
  );
}
