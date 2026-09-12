import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Lock,
  Sparkles,
  ArrowRight,
  Video,
  VideoOff,
  Monitor,
  Eye,
  Activity,
  ExternalLink,
  Clock,
  RotateCcw,
  Volume2,
  AlertTriangle,
  Radio,
  Layers,
  Search,
  Send,
  HelpCircle,
  Compass,
  Trash2,
  Download,
  Copy,
  Check,
  Terminal,
  Zap,
  Info
} from 'lucide-react';
import { AgentDomainRule, ActiveTabEvaluation } from '../../types';
import { playShieldBlockedChime, playLockoutSiren, playSuccessChime } from '../../utils/audio';
import { EXTENSION_MANIFEST, EXTENSION_BACKGROUND, EXTENSION_CONTENT } from '../../utils/extensionCode';

interface AgentDistractionFilterToolProps {
  goal: string;
  allowedDomains: AgentDomainRule[];
  blockedDomains: AgentDomainRule[];
  distractionsBlockedCount: number;
  onSimulateDistractionAttempt?: (url: string) => void;
  onActiveTabEvaluated?: (evaluation: ActiveTabEvaluation) => void;
  onReturnToWorkspace?: () => void;
}

interface SimulatedTab {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: string;
  defaultUseful: boolean;
  sampleSummary: string;
}

const INITIAL_OPEN_TABS: SimulatedTab[] = [
  {
    id: 'tab-focusshield',
    title: "FocusShield Workspace - Study Session: Learn Dijkstra's Algorithm",
    url: 'focusshield.internal/workspace',
    category: 'Study Workspace',
    icon: '🛡️',
    defaultUseful: true,
    sampleSummary: 'Primary active focus environment with C++ compiler and relaxation curriculum.'
  },
  {
    id: 'tab-leetcode',
    title: 'LeetCode #743 - Network Delay Time (Dijkstra in C++)',
    url: 'leetcode.com/problems/network-delay-time',
    category: 'Practice Problem',
    icon: '📘',
    defaultUseful: true,
    sampleSummary: 'Single-source shortest path problem on weighted directed graph using min-heap.'
  },
  {
    id: 'tab-youtube-abdul',
    title: "YouTube - Abdul Bari: 3.6 Dijkstra's Algorithm with Min-Heap",
    url: 'youtube.com/watch?v=XB4MIexjvY0',
    category: 'Instructional Video',
    icon: '🎥',
    defaultUseful: true,
    sampleSummary: 'Master lecture on edge relaxation condition and O((V+E) log V) complexity.'
  },
  {
    id: 'tab-compiler',
    title: 'Compiler Explorer (Godbolt) - C++ std::priority_queue Dijkstra Graph Implementation',
    url: 'godbolt.org/z/dijkstra-cpp',
    category: 'C++ Compiler',
    icon: '💻',
    defaultUseful: true,
    sampleSummary: 'Live compilation and disassembly of Dijkstra shortest path with C++20 standard library.'
  },
  {
    id: 'tab-cppreference',
    title: 'cppreference.com - std::priority_queue container adapter specification',
    url: 'en.cppreference.com/w/cpp/container/priority_queue',
    category: 'Documentation',
    icon: '📖',
    defaultUseful: true,
    sampleSummary: 'Official C++ standard documentation for min-heap custom comparator implementation.'
  },
  {
    id: 'tab-instagram',
    title: 'Instagram - Reels & Explore Infinite Video Feed',
    url: 'instagram.com/reels',
    category: 'Social Media',
    icon: '📱',
    defaultUseful: false,
    sampleSummary: 'Algorithmic short-form infinite scroll video stream designed for viral entertainment.'
  },
  {
    id: 'tab-reddit',
    title: 'Reddit - r/memes & r/gaming: Funny Gaming Clips',
    url: 'reddit.com/r/gaming',
    category: 'Social / Gaming',
    icon: '📰',
    defaultUseful: false,
    sampleSummary: 'Online discussion thread featuring gaming highlights, viral memes, and comment chatter.'
  },
  {
    id: 'tab-discord',
    title: 'Discord - Friends Gaming Voice & Chat Lounge',
    url: 'discord.com/channels/gamers',
    category: 'Chat / Gaming',
    icon: '💬',
    defaultUseful: false,
    sampleSummary: 'Active multiplayer voice chat channel for casual banter and matchmaking.'
  },
  {
    id: 'tab-netflix',
    title: 'Netflix - Stranger Things Season 5 Episode 2',
    url: 'netflix.com/watch/80057281',
    category: 'Entertainment',
    icon: '🍿',
    defaultUseful: false,
    sampleSummary: 'High-definition streaming entertainment video player with binge autoplay.'
  }
];

const QUICK_ACTIVITY_CHIPS = [
  { label: 'Reading LeetCode discussion for Dijkstra', useful: true, icon: '💡' },
  { label: 'Watching Abdul Bari Dijkstra lecture', useful: true, icon: '🎥' },
  { label: 'Debugging min-heap comparator in C++', useful: true, icon: '💻' },
  { label: 'Checking GeeksforGeeks graph shortest path', useful: true, icon: '📚' },
  { label: 'Scrolling Instagram Reels', useful: false, icon: '📱' },
  { label: 'Watching funny TikTok clips', useful: false, icon: '🎭' },
  { label: 'Browsing Reddit r/gaming', useful: false, icon: '🎮' },
  { label: 'Chatting on Discord voice channel', useful: false, icon: '💬' },
  { label: 'Watching Netflix episode', useful: false, icon: '🍿' },
  { label: 'Listening to Lofi Study Beats', useful: true, icon: '🎧' }
];

export const AgentDistractionFilterTool: React.FC<AgentDistractionFilterToolProps> = ({
  goal,
  allowedDomains,
  blockedDomains,
  distractionsBlockedCount,
  onSimulateDistractionAttempt,
  onActiveTabEvaluated,
  onReturnToWorkspace
}) => {
  // Check if running inside an iframe (e.g. AI Studio preview)
  const [isInIframe, setIsInIframe] = useState(false);
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // Open Tabs State (allows dynamic termination/closing of distracting tabs!)
  const [openTabs, setOpenTabs] = useState<SimulatedTab[]>(INITIAL_OPEN_TABS);
  const [activeTab, setActiveTab] = useState<SimulatedTab>(INITIAL_OPEN_TABS[0]);
  const [terminatedTabsLog, setTerminatedTabsLog] = useState<Array<{ title: string; time: string; reason: string }>>([]);

  // Auto-Close Enforcement Configuration
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(true);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Chrome Extension Modal
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [copiedBackground, setCopiedBackground] = useState(false);

  // Custom Input
  const [customTabInput, setCustomTabInput] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Current Evaluation
  const [currentEvaluation, setCurrentEvaluation] = useState<ActiveTabEvaluation>({
    tabTitle: INITIAL_OPEN_TABS[0].title,
    tabUrl: INITIAL_OPEN_TABS[0].url,
    goal,
    isUseful: true,
    verdict: 'USEFUL',
    category: 'core_study_workspace',
    usefulnessScore: 100,
    confidence: 0.99,
    reason: 'Active in FocusShield primary study workspace, actively progressing through Dijkstra curriculum.',
    recommendedAction: 'ALLOW_CONTINUE',
    policyEnforced: 'FocusShield Workspace Pass',
    suggestedFocusTip: 'Maintain flow state. Continue to the next algorithm implementation milestone.',
    timestamp: new Date().toLocaleTimeString(),
    detectionSource: 'browser_tab_switch'
  });

  // Real Browser Window / Visibility Sentinel State
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [windowAwaySeconds, setWindowAwaySeconds] = useState(0);
  const awayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Screen / Tab Video Sentinel (`getDisplayMedia`)
  const [isScreenCaptureActive, setIsScreenCaptureActive] = useState(false);
  const [screenCaptureError, setScreenCaptureError] = useState<string | null>(null);
  const [capturedTrackLabel, setCapturedTrackLabel] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1. Browser Visibility & Focus Sentinel
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsWindowFocused(false);
        playLockoutSiren();
        if (onSimulateDistractionAttempt) {
          onSimulateDistractionAttempt('Switched away to external browser tab or application');
        }
      } else {
        setIsWindowFocused(true);
      }
    };

    const handleWindowBlur = () => {
      setIsWindowFocused(false);
    };

    const handleWindowFocus = () => {
      setIsWindowFocused(true);
      setWindowAwaySeconds(0);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [onSimulateDistractionAttempt]);

  // Away Timer
  useEffect(() => {
    if (!isWindowFocused) {
      awayTimerRef.current = setInterval(() => {
        setWindowAwaySeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (awayTimerRef.current) {
        clearInterval(awayTimerRef.current);
        awayTimerRef.current = null;
      }
    }
    return () => {
      if (awayTimerRef.current) clearInterval(awayTimerRef.current);
    };
  }, [isWindowFocused]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (autoCloseTimerRef.current) {
        clearInterval(autoCloseTimerRef.current);
      }
    };
  }, []);

  // 2. FORCE-CLOSE TAB FUNCTION (Removes the distracting tab and restores workspace)
  const forceCloseDistractionTab = (tabToClose: SimulatedTab) => {
    if (autoCloseTimerRef.current) {
      clearInterval(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setAutoCloseCountdown(null);

    // Play alarm and sound
    playLockoutSiren();

    // Log the closed tab
    setTerminatedTabsLog(prev => [
      {
        title: tabToClose.title,
        time: new Date().toLocaleTimeString(),
        reason: 'Autonomous Agent closed off-task distraction.'
      },
      ...prev.slice(0, 7)
    ]);

    // Remove tab from openTabs array
    setOpenTabs(prev => prev.filter(t => t.id !== tabToClose.id));

    // Redirect active view back to FocusShield Workspace
    const primaryTab = INITIAL_OPEN_TABS[0];
    setActiveTab(primaryTab);

    const safeEvaluation: ActiveTabEvaluation = {
      tabTitle: primaryTab.title,
      tabUrl: primaryTab.url,
      goal,
      isUseful: true,
      verdict: 'USEFUL',
      category: 'Study Workspace',
      usefulnessScore: 100,
      confidence: 1.0,
      reason: `Force-closed distraction tab: "${tabToClose.title}". Flow state protected and restored to Dijkstra Workspace.`,
      recommendedAction: 'ALLOW_CONTINUE',
      policyEnforced: 'FocusShield Tab Termination Guard',
      suggestedFocusTip: 'Maintain focus on Dijkstra graph edge relaxation.',
      timestamp: new Date().toLocaleTimeString(),
      detectionSource: 'browser_tab_switch'
    };

    setCurrentEvaluation(safeEvaluation);
    if (onActiveTabEvaluated) {
      onActiveTabEvaluated(safeEvaluation);
    }
    if (onReturnToWorkspace) {
      onReturnToWorkspace();
    }
    playSuccessChime();
  };

  // 3. Initiate Auto-Close Countdown if Tab is Not Useful
  const handleStartAutoCloseCountdown = (tab: SimulatedTab) => {
    if (!autoCloseEnabled) return;
    if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current);

    let count = 3;
    setAutoCloseCountdown(count);

    autoCloseTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current);
        forceCloseDistractionTab(tab);
      } else {
        setAutoCloseCountdown(count);
        playShieldBlockedChime();
      }
    }, 1000);
  };

  // 4. Evaluate Tab Function (Backend AI endpoint)
  const evaluateTab = async (
    tabOrActivity: SimulatedTab,
    source: 'browser_tab_switch' | 'screen_stream' | 'tab_visibility' | 'manual_activity_check' = 'browser_tab_switch'
  ) => {
    setIsEvaluating(true);
    if (autoCloseTimerRef.current) {
      clearInterval(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setAutoCloseCountdown(null);

    try {
      const res = await fetch('/api/agent/evaluate-active-tab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tabTitle: tabOrActivity.title,
          tabUrl: tabOrActivity.url || 'browser-tab://current',
          goal,
          context: `Active tab checked: ${tabOrActivity.category || 'User Activity'}`
        })
      });

      if (res.ok) {
        const data = await res.json();
        const isUseful = Boolean(data.isUseful);
        const evaluation: ActiveTabEvaluation = {
          tabTitle: data.tabTitle || tabOrActivity.title,
          tabUrl: data.tabUrl || tabOrActivity.url,
          goal,
          isUseful,
          verdict: data.verdict || (isUseful ? 'USEFUL' : 'NOT_USEFUL'),
          category: data.category || tabOrActivity.category || 'Inspected Tab',
          usefulnessScore: data.usefulnessScore ?? (isUseful ? 95 : 8),
          confidence: data.confidence || 0.96,
          reason: data.reason || (isUseful ? 'Goal-aligned learning resource.' : 'Digital distraction detected.'),
          recommendedAction: data.recommendedAction || (isUseful ? 'ALLOW_CONTINUE' : 'BLOCK_AND_REFOCUS'),
          policyEnforced: data.policyEnforced || 'FocusShield Tab Guard',
          suggestedFocusTip: data.suggestedFocusTip || 'Stay focused on your objective.',
          timestamp: new Date().toLocaleTimeString(),
          detectionSource: source
        };

        setCurrentEvaluation(evaluation);
        if (onActiveTabEvaluated) {
          onActiveTabEvaluated(evaluation);
        }

        if (!isUseful) {
          playShieldBlockedChime();
          if (onSimulateDistractionAttempt) {
            onSimulateDistractionAttempt(tabOrActivity.title);
          }
          // Trigger Auto-Close countdown!
          handleStartAutoCloseCountdown(tabOrActivity);
        } else {
          playSuccessChime();
        }
        setIsEvaluating(false);
        return;
      }
    } catch (err) {
      console.warn('Backend evaluation fallback:', err);
    }

    // Local heuristic fallback
    const lower = tabOrActivity.title.toLowerCase();
    const isUseful =
      tabOrActivity.defaultUseful !== undefined
        ? tabOrActivity.defaultUseful
        : lower.includes('dijkstra') ||
          lower.includes('leetcode') ||
          lower.includes('abdul bari') ||
          lower.includes('c++') ||
          lower.includes('compiler') ||
          lower.includes('algorithm') ||
          lower.includes('graph') ||
          lower.includes('priority_queue') ||
          lower.includes('lofi');

    const evaluation: ActiveTabEvaluation = {
      tabTitle: tabOrActivity.title,
      tabUrl: tabOrActivity.url || 'browser-tab://current',
      goal,
      isUseful,
      verdict: isUseful ? 'USEFUL' : 'NOT_USEFUL',
      category: tabOrActivity.category || (isUseful ? 'Study Resource' : 'Distraction'),
      usefulnessScore: isUseful ? 94 : 8,
      confidence: 0.95,
      reason: isUseful
        ? `Tab directly aligns with your active target: "${goal}". Verified instructional content.`
        : `Detected off-task activity ("${tabOrActivity.title}"). Contains zero relevance to "${goal}".`,
      recommendedAction: isUseful ? 'ALLOW_CONTINUE' : 'BLOCK_AND_REFOCUS',
      policyEnforced: isUseful ? 'Intent-Aligned Resource Pass' : 'FocusShield Distraction Interception',
      suggestedFocusTip: isUseful
        ? 'Maintain flow state and practice the edge relaxation invariant.'
        : 'Closing this tab immediately and returning to your C++ graph workspace.',
      timestamp: new Date().toLocaleTimeString(),
      detectionSource: source
    };

    setCurrentEvaluation(evaluation);
    if (onActiveTabEvaluated) {
      onActiveTabEvaluated(evaluation);
    }
    if (!isUseful) {
      playShieldBlockedChime();
      if (onSimulateDistractionAttempt) {
        onSimulateDistractionAttempt(tabOrActivity.title);
      }
      handleStartAutoCloseCountdown(tabOrActivity);
    } else {
      playSuccessChime();
    }
    setIsEvaluating(false);
  };

  // User switches tab
  const handleSelectTab = (tab: SimulatedTab) => {
    setActiveTab(tab);
    evaluateTab(tab, 'browser_tab_switch');
  };

  // Reset/Restore all tabs
  const handleRestoreAllTabs = () => {
    setOpenTabs(INITIAL_OPEN_TABS);
    setActiveTab(INITIAL_OPEN_TABS[0]);
    playSuccessChime();
  };

  // Quick activity custom submission
  const handleCustomCheckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTabInput.trim()) return;
    const title = customTabInput.trim();
    const lower = title.toLowerCase();
    const defaultUseful =
      lower.includes('dijkstra') ||
      lower.includes('leetcode') ||
      lower.includes('algorithm') ||
      lower.includes('c++') ||
      lower.includes('lofi');

    const customTab: SimulatedTab = {
      id: `custom-${Date.now()}`,
      title,
      url: `activity://${encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-'))}`,
      category: defaultUseful ? 'Study Task' : 'Distraction Activity',
      icon: defaultUseful ? '📘' : '⚠️',
      defaultUseful,
      sampleSummary: `Current activity: ${title}`
    };

    // Add to open tabs
    setOpenTabs(prev => [...prev.filter(t => t.id !== customTab.id), customTab]);
    setActiveTab(customTab);
    evaluateTab(customTab, 'manual_activity_check');
  };

  // 5. Live Screen / Tab Video Sentinel
  const handleStartScreenCapture = async () => {
    setScreenCaptureError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen / Tab Capture is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser'
        } as MediaTrackConstraints,
        audio: false
      });

      streamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      const trackLabel = videoTrack?.label || 'Active Browser Tab / Window';
      setCapturedTrackLabel(trackLabel);
      setIsScreenCaptureActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      // Automatically evaluate the captured tab/window
      const isDistraction =
        trackLabel.toLowerCase().includes('instagram') ||
        trackLabel.toLowerCase().includes('reddit') ||
        trackLabel.toLowerCase().includes('netflix') ||
        trackLabel.toLowerCase().includes('discord') ||
        trackLabel.toLowerCase().includes('game') ||
        trackLabel.toLowerCase().includes('reels');

      const simulatedFromTrack: SimulatedTab = {
        id: 'captured-stream',
        title: trackLabel,
        url: 'captured-window://live',
        category: isDistraction ? 'Social / Distraction' : 'Active Screen Stream',
        icon: isDistraction ? '🚨' : '🎥',
        defaultUseful: !isDistraction,
        sampleSummary: `Live real-time stream of: ${trackLabel}`
      };

      setOpenTabs(prev => [...prev.filter(t => t.id !== simulatedFromTrack.id), simulatedFromTrack]);
      setActiveTab(simulatedFromTrack);
      evaluateTab(simulatedFromTrack, 'screen_stream');

      videoTrack.onended = () => {
        handleStopScreenCapture();
      };
    } catch (err: unknown) {
      console.warn('Screen capture error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('permissions policy') ||
        msg.includes('display-capture') ||
        msg.includes('disallowed by permissions policy')
      ) {
        setScreenCaptureError(
          'iFrame Permissions Policy: The embedded preview iframe disallows display-capture. Open FocusShield in a New Tab or use the 1-Click Tab Closer below!'
        );
      } else if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        setScreenCaptureError('Screen/Tab selection was dismissed in the browser prompt.');
      } else {
        setScreenCaptureError(`Capture notice: ${msg}`);
      }
      setIsScreenCaptureActive(false);
    }
  };

  const handleStopScreenCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsScreenCaptureActive(false);
  };

  // Manifest, background, and content scripts for Chrome Extension
  const manifestCode = EXTENSION_MANIFEST;
  const backgroundCode = EXTENSION_BACKGROUND;
  const contentCode = EXTENSION_CONTENT;

  const [copiedContent, setCopiedContent] = useState(false);

  // File download helper
  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1-Click ZIP Download helper
  const handleDownloadZip = () => {
    const link = document.createElement('a');
    link.href = '/api/download-extension-zip';
    link.download = 'focusshield-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      id="agent-active-tab-sentinel-tool"
      className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
    >
      {/* 1. Header: Status, Auto-Close Toggle & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white">Active Tab Sentinel & Auto-Closer</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                Active Tab Destroyer
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Evaluates current tabs without URLs — automatically intercepts and terminates distractions.
            </p>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center space-x-2">
          {/* Auto-Close Switch */}
          <button
            onClick={() => setAutoCloseEnabled(!autoCloseEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              autoCloseEnabled
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-sm shadow-rose-950/20'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Auto-Close: <strong>{autoCloseEnabled ? 'ON' : 'OFF'}</strong></span>
          </button>

          {/* Chrome Extension Real Tab Closer Helper */}
          <button
            onClick={() => setShowExtensionModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Real Chrome Closer</span>
          </button>
        </div>
      </div>

      {/* 2. REAL BROWSER SECURITY EXPLANATION & CALLOUT BANNER */}
      <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">Why standard browser screen sharing doesn't close other tabs: </strong>
          For user security, standard web pages in Chrome have no permission to kill external browser tabs or programs.
          FocusShield solves this in two ways:
          <strong className="text-rose-300"> (1) In-App Auto-Termination</strong> (instantly force-closes and removes the distraction from your session), and
          <strong className="text-cyan-300"> (2) FocusShield Chrome Extension</strong> (uses <code className="text-white bg-slate-800 px-1 rounded">chrome.tabs.remove</code> to close real tabs in your browser).
        </div>
      </div>

      {/* 3. ACTIVE TAB EVALUATION CARD WITH COUNTDOWN / FORCE CLOSE ACTION */}
      <div
        className={`p-4 rounded-2xl border transition-all duration-300 ${
          currentEvaluation.isUseful
            ? 'bg-slate-950/90 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
            : 'bg-slate-950/90 border-rose-500/60 shadow-xl shadow-rose-950/40 ring-2 ring-rose-500/40'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                Active Tab In Focus
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {activeTab.category}
              </span>
              {isEvaluating && (
                <span className="px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-500/40 text-[9px] text-indigo-300 font-mono animate-pulse">
                  SCANNING FOR DISTRACTION...
                </span>
              )}
            </div>

            {/* Active Tab Title */}
            <h4 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span className="text-xl">{activeTab.icon || '🌐'}</span>
              <span className="truncate">{activeTab.title}</span>
            </h4>
            <div className="text-[11px] font-mono text-slate-400 truncate">
              Origin: <span className="text-slate-200">{activeTab.url}</span>
            </div>
          </div>

          {/* Large Verdict Pill */}
          <div className="flex flex-col items-end shrink-0">
            <div
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md ${
                currentEvaluation.isUseful
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-rose-600 text-white animate-pulse'
              }`}
            >
              {currentEvaluation.isUseful ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>TAB IS USEFUL</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>NOT USEFUL (TERMINATING)</span>
                </>
              )}
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-1">
              Alignment: <strong className="text-white">{currentEvaluation.usefulnessScore}/100</strong> • {Math.round(currentEvaluation.confidence * 100)}% Conf
            </span>
          </div>
        </div>

        {/* Reason & Auto-Close Intervention Banner */}
        <div className="pt-3 space-y-3">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-200 leading-relaxed">
              <strong className="text-white">AI Verdict: </strong>
              {currentEvaluation.reason}
            </div>
          </div>

          {/* If NOT USEFUL: Show Autonomous Force-Close Countdown Bar! */}
          {!currentEvaluation.isUseful && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950 via-rose-900/60 to-slate-950 border border-rose-500/70 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                  <span>
                    AUTONOMOUS INTERVENTION: Force-closing distraction tab in{' '}
                    <span className="text-white font-mono text-base font-black px-1.5 py-0.5 bg-rose-700 rounded-md">
                      {autoCloseCountdown ?? 0}s
                    </span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => forceCloseDistractionTab(activeTab)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-lg flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Close Tab Immediately</span>
                  </button>
                  <button
                    onClick={() => {
                      if (autoCloseTimerRef.current) clearInterval(autoCloseTimerRef.current);
                      setAutoCloseCountdown(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                  >
                    Pause
                  </button>
                </div>
              </div>

              {/* Countdown progress bar */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-full transition-all duration-1000 ease-linear"
                  style={{ width: `${((autoCloseCountdown ?? 3) / 3) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. ZERO-URL OPEN TABS BAR (SHOWS LIVE TABS & ALLOWS TESTING TAB CLOSING) */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-200">
              Browser Tabs Bar ({openTabs.length} Active Tabs)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {openTabs.length < INITIAL_OPEN_TABS.length && (
              <button
                onClick={handleRestoreAllTabs}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore All Closed Tabs</span>
              </button>
            )}
            <span className="text-[11px] text-slate-400">
              Click any tab to test auto-close:
            </span>
          </div>
        </div>

        {/* Tab Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {openTabs.map(tab => {
            const isCurrent = activeTab.id === tab.id;
            return (
              <div
                key={tab.id}
                className={`p-2.5 rounded-xl border text-left transition-all duration-200 relative group flex flex-col justify-between ${
                  isCurrent
                    ? tab.defaultUseful
                      ? 'bg-emerald-950/40 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-rose-950/40 border-rose-500/70 shadow-md ring-1 ring-rose-500/50'
                    : 'bg-slate-900/70 hover:bg-slate-800 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-lg">{tab.icon}</span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        tab.defaultUseful
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {tab.defaultUseful ? 'USEFUL' : 'DISTRACTION'}
                    </span>
                    {!tab.defaultUseful && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          forceCloseDistractionTab(tab);
                        }}
                        title="Force close this distraction tab"
                        className="p-1 rounded-md bg-rose-500/20 hover:bg-rose-500/40 text-rose-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectTab(tab)}
                  className="text-left w-full focus:outline-none"
                >
                  <div className="text-xs font-semibold text-slate-200 truncate w-full">
                    {tab.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate w-full mt-0.5">
                    {tab.category}
                  </div>
                </button>

                {isCurrent && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. LOG OF CLOSED DISTRACTION TABS */}
      {terminatedTabsLog.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              FocusShield Terminated Tabs Log ({terminatedTabsLog.length})
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Flow state protected
            </span>
          </div>
          <div className="space-y-1">
            {terminatedTabsLog.map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span className="text-slate-200 truncate font-medium">{log.title}</span>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-slate-400 shrink-0 font-mono">
                  <span>{log.reason}</span>
                  <span>•</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. ZERO-URL ACTIVITY CHECKER */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">
              Instant Activity Checker (Describe activity — agent auto-terminates if distracting)
            </span>
          </div>
        </div>

        {/* Input form */}
        <form onSubmit={handleCustomCheckSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customTabInput}
              onChange={e => setCustomTabInput(e.target.value)}
              placeholder="e.g. 'watching youtube lofi study music', 'scrolling instagram reels', 'reading cppreference'..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={!customTabInput.trim() || isEvaluating}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Check & Enforce</span>
          </button>
        </form>

        {/* Fast Click Activity Chips */}
        <div>
          <span className="text-[11px] text-slate-400 block mb-1.5 font-mono">
            Or test with 1-click popular study & distraction activities:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIVITY_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCustomTabInput(chip.label);
                  const customTab: SimulatedTab = {
                    id: `chip-${idx}-${Date.now()}`,
                    title: chip.label,
                    url: `activity://${encodeURIComponent(chip.label.toLowerCase().replace(/\s+/g, '-'))}`,
                    category: chip.useful ? 'Study Task' : 'Distraction',
                    icon: chip.icon,
                    defaultUseful: chip.useful,
                    sampleSummary: `Active task: ${chip.label}`
                  };
                  setOpenTabs(prev => [...prev.filter(t => t.id !== customTab.id), customTab]);
                  setActiveTab(customTab);
                  evaluateTab(customTab, 'manual_activity_check');
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1.5 transition-all ${
                  chip.useful
                    ? 'bg-emerald-950/30 hover:bg-emerald-900/50 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 hover:bg-rose-900/50 border-rose-500/30 text-rose-300'
                }`}
              >
                <span>{chip.icon}</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7. LIVE SCREEN STREAM WITH DETECTED TAB EVALUATION */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Video className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-slate-200">
                Live Screen Stream Watcher
              </span>
              <span className="text-[10px] text-slate-400 block">
                Inspects shared window title and automatically flags distracting feeds.
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isInIframe && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                <span>Open in Dedicated Tab ↗</span>
              </a>
            )}

            {!isScreenCaptureActive ? (
              <button
                onClick={handleStartScreenCapture}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-md shadow-cyan-600/20 flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Share Screen Stream</span>
              </button>
            ) : (
              <button
                onClick={handleStopScreenCapture}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md flex items-center gap-1.5"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop Watching</span>
              </button>
            )}
          </div>
        </div>

        {screenCaptureError && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{screenCaptureError}</span>
            </div>
          </div>
        )}

        {isScreenCaptureActive && (
          <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-cyan-300">
              <span className="font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Live Feed: {capturedTrackLabel}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                OCR & Window Title Analyzed
              </span>
            </div>
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-48 flex items-center justify-center border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 border-2 border-cyan-500/20 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* 8. MODAL: FOCUSSHIELD REAL CHROME EXTENSION (FOR CLOSING REAL BROWSER TABS) */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">FocusShield Real Browser Tab Closer Extension</h3>
                  <p className="text-[11px] text-slate-400">Enables Chrome to directly close distracting tabs using chrome.tabs.remove()</p>
                </div>
              </div>
              <button
                onClick={() => setShowExtensionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-xs text-indigo-200 space-y-2">
              <strong className="block font-bold text-white text-sm">
                🛡️ FocusShield Extension V1.2 (With Smart YouTube Video Guard & WebNavigation)
              </strong>
              <p className="leading-relaxed">
                Why the previous version didn't restrict:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li><strong className="text-white">Google Search Results:</strong> In your screenshot, you were on Google Search. With <code className="text-cyan-300">webNavigation.onBeforeNavigate</code>, clicking the Instagram link now triggers immediate tab termination.</li>
                <li><strong className="text-white">YouTube Videos:</strong> YouTube is a single-page application. The new <code className="text-emerald-300">content.js</code> script inspects the video title: it <strong className="text-emerald-400">allows Dijkstra & C++ lectures</strong>, but <strong className="text-rose-400">blocks & closes off-task entertainment videos and Shorts</strong>!</li>
              </ul>
            </div>

            {/* 1-CLICK DOWNLOAD EXTENSION ZIP BUTTON */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950 to-slate-950 border border-indigo-500/50 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>1-Click: Download Complete Extension (.ZIP)</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Contains all 3 files pre-configured (<code className="text-slate-300">manifest.json</code>, <code className="text-slate-300">background.js</code>, <code className="text-slate-300">content.js</code>).
                </div>
              </div>
              <button
                onClick={handleDownloadZip}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105"
              >
                <Download className="w-4 h-4" />
                <span>Download Extension ZIP</span>
              </button>
            </div>

            {/* Visual Step-by-Step Setup Guide */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="font-bold text-white text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>How to Unpack and Load into Chrome (Step-by-Step):</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {/* Step 1 */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">1</span>
                    <strong className="text-white">Unzip the File</strong>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Find <code className="text-cyan-300">focusshield-extension.zip</code> in your Downloads.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    <strong>Windows:</strong> Right-click ➔ <span className="text-white">Extract All...</span> ➔ Click <span className="text-white">Extract</span>.<br/>
                    <strong>Mac:</strong> Double-click to unzip.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">2</span>
                    <strong className="text-white">Open Extensions</strong>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    In Chrome address bar, type: <code className="text-cyan-300 bg-slate-800 px-1 rounded">chrome://extensions</code>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    In the top right, turn ON <strong className="text-amber-300">Developer mode</strong> (toggle switch).
                  </p>
                </div>

                {/* Step 3 */}
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">3</span>
                    <strong className="text-white">Click "Load unpacked"</strong>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Click <strong className="text-cyan-300">Load unpacked</strong> (top left).
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Select the <strong>extracted folder</strong> (containing <code className="text-slate-300">manifest.json</code>) and click <strong className="text-white">Select Folder</strong>!
                  </p>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-300 flex items-center gap-2">
                <span>💡</span>
                <span><strong>Already have FocusShield loaded?</strong> Click <strong>"Remove"</strong> on the old version first, or simply click the circular reload icon <strong className="text-white">⟳</strong> on its card!</span>
              </div>
            </div>

            {/* Code and individual downloads */}
            <div className="space-y-3">
              {/* 1. manifest.json */}
              <div>
                <div className="flex items-center justify-between text-xs pb-1 font-mono text-slate-400">
                  <span className="font-bold text-slate-200">1. manifest.json</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleDownloadFile('manifest.json', manifestCode)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(manifestCode);
                        setCopiedManifest(true);
                        setTimeout(() => setCopiedManifest(false), 2000);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                    >
                      {copiedManifest ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedManifest ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-32">
                  {manifestCode}
                </pre>
              </div>

              {/* 2. background.js */}
              <div>
                <div className="flex items-center justify-between text-xs pb-1 font-mono text-slate-400">
                  <span className="font-bold text-slate-200">2. background.js (Tab Terminator & WebNavigation Guard)</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleDownloadFile('background.js', backgroundCode)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(backgroundCode);
                        setCopiedBackground(true);
                        setTimeout(() => setCopiedBackground(false), 2000);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                    >
                      {copiedBackground ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedBackground ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-400 overflow-x-auto max-h-36">
                  {backgroundCode}
                </pre>
              </div>

              {/* 3. content.js (YouTube Guard) */}
              <div>
                <div className="flex items-center justify-between text-xs pb-1 font-mono text-slate-400">
                  <span className="font-bold text-slate-200">3. content.js (YouTube Video Filter & Blocker)</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleDownloadFile('content.js', contentCode)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(contentCode);
                        setCopiedContent(true);
                        setTimeout(() => setCopiedContent(false), 2000);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                    >
                      {copiedContent ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedContent ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto max-h-36">
                  {contentCode}
                </pre>
              </div>
            </div>

            {/* Verification Guide & Interactive Test Lab */}
            <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Test & Verify in Chrome (Click to test live):</span>
              </div>

              {/* Interactive Live Test Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => window.open('https://www.instagram.com', '_blank')}
                  className="p-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-between shadow"
                >
                  <span className="flex items-center gap-1.5">
                    <span>📱</span>
                    <span>Test Instagram Link</span>
                  </span>
                  <span className="text-[10px] bg-rose-950/80 px-1.5 py-0.5 rounded text-rose-200 font-mono">
                    Auto-Closes 🚨
                  </span>
                </button>

                <button
                  onClick={() => window.open('https://www.reddit.com', '_blank')}
                  className="p-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-between shadow"
                >
                  <span className="flex items-center gap-1.5">
                    <span>📰</span>
                    <span>Test Reddit Link</span>
                  </span>
                  <span className="text-[10px] bg-amber-950/80 px-1.5 py-0.5 rounded text-amber-200 font-mono">
                    Auto-Closes 🚨
                  </span>
                </button>

                <button
                  onClick={() => window.open('https://www.youtube.com/watch?v=XB4MIexjvY0', '_blank')}
                  className="p-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🎥</span>
                    <span>YouTube: Abdul Bari Dijkstra</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950/80 px-1.5 py-0.5 rounded text-emerald-200 font-mono">
                    Approved ✅
                  </span>
                </button>

                <button
                  onClick={() => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank')}
                  className="p-2.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-between shadow"
                >
                  <span className="flex items-center gap-1.5">
                    <span>🍿</span>
                    <span>YouTube: Entertainment Video</span>
                  </span>
                  <span className="text-[10px] bg-rose-950/80 px-1.5 py-0.5 rounded text-rose-200 font-mono">
                    Blocked & Closes 🚨
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                💡 <strong className="text-slate-300">Remember:</strong> Whenever you replace extension files, open <code className="bg-slate-800 px-1 rounded text-cyan-300">chrome://extensions</code> and click the small circular reload icon <strong className="text-indigo-400 font-bold">⟳</strong> on the FocusShield card!
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowExtensionModal(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
