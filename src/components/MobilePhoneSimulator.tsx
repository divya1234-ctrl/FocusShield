import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Play,
  Clock,
  Wifi,
  Battery,
  Sparkles,
  ArrowLeft,
  Home,
  Layers,
  Search,
  CheckCircle2,
  Instagram,
  Youtube,
  Twitter,
  MessageSquare,
  Gamepad2,
  Code,
  FileText,
  Brain,
  MessageCircle,
  ExternalLink,
  X,
  RefreshCw,
  Globe
} from 'lucide-react';
import { AppItem, VideoItem, FocusIntentRule, HistoryEvent } from '../types';
import { playShieldBlockedChime } from '../utils/audio';
import { handleThumbnailError } from '../utils/imageFallback';
import { evaluateVideoAgainstRule } from '../utils/focusMatcher';
import { ExternalLockdownGuardianModal } from './ExternalLockdownGuardianModal';

interface MobilePhoneSimulatorProps {
  apps: AppItem[];
  videos: VideoItem[];
  focusRule: FocusIntentRule | null;
  events: HistoryEvent[];
  onVideoWatched: (video: VideoItem) => void;
  onDistractionBlocked: (video: VideoItem, reason: string) => void;
  onAppBlockedAttempt: (app: AppItem) => void;
}

export const MobilePhoneSimulator: React.FC<MobilePhoneSimulatorProps> = ({
  apps,
  videos,
  focusRule,
  events,
  onVideoWatched,
  onDistractionBlocked,
  onAppBlockedAttempt
}) => {
  const [activeScreen, setActiveScreen] = useState<'home' | 'youtube' | 'blocked_app' | 'focus_guard' | 'running_app'>('home');
  const [attemptedApp, setAttemptedApp] = useState<AppItem | null>(null);
  const [runningApp, setRunningApp] = useState<AppItem | null>(null);
  const [miniCodeOutput, setMiniCodeOutput] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileVideos, setMobileVideos] = useState<VideoItem[]>(videos);
  const [isMobileSearching, setIsMobileSearching] = useState(false);
  const [activeMobileQuery, setActiveMobileQuery] = useState('');
  const [selectedMobileVideo, setSelectedMobileVideo] = useState<VideoItem | null>(null);
  const [showMobileGuardianModal, setShowMobileGuardianModal] = useState(false);
  const [mobileBlockedAlert, setMobileBlockedAlert] = useState<{
    video: VideoItem;
    reason: string;
  } | null>(null);

  // Mobile Browser & Tabs Sentinel State
  const [browserTab, setBrowserTab] = useState<'leetcode' | 'github' | 'reddit' | 'instagram'>('leetcode');
  const [browserInputUrl, setBrowserInputUrl] = useState('leetcode.com/problemset');
  const [browserBlockedNotice, setBrowserBlockedNotice] = useState<string | null>(null);

  const youtubeApp = apps.find((a) => a.id === 'app-youtube');
  const isYouTubeDeactivated = Boolean(youtubeApp?.isBlocked);

  // Sync mobile videos when main videos change and not searching
  useEffect(() => {
    if (!activeMobileQuery) {
      setMobileVideos(videos);
    }
  }, [videos, activeMobileQuery]);

  // Execute real YouTube search on mobile
  const handleMobileSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    setActiveMobileQuery(q);
    if (!q) {
      setMobileVideos(videos);
      setIsMobileSearching(false);
      return;
    }

    setIsMobileSearching(true);
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, focusRule })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.videos && Array.isArray(data.videos)) {
          setMobileVideos(data.videos);
        }
      }
    } catch (err) {
      console.error('Error in mobile search:', err);
    } finally {
      setIsMobileSearching(false);
    }
  };

  // Sync mobile selected video if it violates the newly activated focus rule
  useEffect(() => {
    if (focusRule?.isActive && selectedMobileVideo) {
      const evaluation = evaluateVideoAgainstRule(selectedMobileVideo, focusRule);
      if (!evaluation.isAllowed) {
        const approved = videos.find((v) => evaluateVideoAgainstRule(v, focusRule).isAllowed);
        setSelectedMobileVideo(approved || null);
      }
    }
  }, [focusRule?.targetTopic, focusRule?.isActive, videos]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'Youtube':
        return <Youtube className="w-6 h-6 text-red-500" />;
      case 'Instagram':
        return <Instagram className="w-6 h-6 text-pink-500" />;
      case 'Twitter':
        return <Twitter className="w-6 h-6 text-sky-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-6 h-6 text-orange-500" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-6 h-6 text-amber-500" />;
      case 'Code':
        return <Code className="w-6 h-6 text-amber-400" />;
      case 'FileText':
        return <FileText className="w-6 h-6 text-slate-200" />;
      case 'Brain':
        return <Brain className="w-6 h-6 text-blue-400" />;
      case 'MessageCircle':
        return <MessageCircle className="w-6 h-6 text-emerald-400" />;
      case 'Globe':
        return <Globe className="w-6 h-6 text-sky-400" />;
      default:
        return <Smartphone className="w-6 h-6 text-indigo-400" />;
    }
  };

  const handleAppTap = (app: AppItem) => {
    const isLimitExceeded = app.dailyLimitMinutes > 0 && app.usedTodayMinutes >= app.dailyLimitMinutes;

    // 1. STRICT LOCKOUT: If deactivated OR daily limit exceeded, NEVER allow access!
    if (app.isBlocked || isLimitExceeded) {
      playShieldBlockedChime();
      setAttemptedApp(app);
      setActiveScreen('blocked_app');
      onAppBlockedAttempt(app);
      return;
    }

    // 2. If YouTube is permitted and within limits, open YouTube app
    if (app.id === 'app-youtube') {
      setActiveScreen('youtube');
      return;
    }

    // 3. Allowed study/productivity application: Launch active simulator
    setRunningApp(app);
    setMiniCodeOutput(null);
    setActiveScreen('running_app');
  };

  const handleMobileVideoTap = (video: VideoItem) => {
    const evaluation = evaluateVideoAgainstRule(video, focusRule);
    if (!evaluation.isAllowed) {
      playShieldBlockedChime();
      onDistractionBlocked(video, evaluation.reason);
      setMobileBlockedAlert({
        video,
        reason: evaluation.reason
      });
      return;
    }
    setSelectedMobileVideo(video);
    onVideoWatched(video);
  };

  const handleExternalYouTubeClick = () => {
    if (focusRule?.isActive) {
      setShowMobileGuardianModal(true);
    } else if (selectedMobileVideo) {
      window.open(`https://www.youtube.com/watch?v=${selectedMobileVideo.youtubeId}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="w-full max-w-full flex flex-col items-center justify-center py-2 sm:py-6 px-1">
      {/* Device Frame */}
      <div className="relative w-full max-w-[335px] xs:max-w-[350px] sm:max-w-[380px] h-[640px] sm:h-[740px] max-h-[88vh] bg-slate-950 rounded-[32px] sm:rounded-[48px] p-2 sm:p-3.5 shadow-2xl border-2 sm:border-4 border-slate-700 ring-1 ring-slate-800 flex flex-col justify-between overflow-hidden mx-auto">
        {/* Dynamic Island / Speaker */}
        <div className="absolute top-3 sm:top-5 left-1/2 -translate-x-1/2 w-24 sm:w-28 h-4 sm:h-5 bg-black rounded-full z-30 flex items-center justify-between px-2.5 sm:px-3">
          <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-slate-800" />
          <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-indigo-950" />
        </div>

        {/* Status Bar */}
        <div className="h-6 flex items-center justify-between px-4 sm:px-6 pt-1 text-[10px] sm:text-[11px] font-mono text-slate-300 z-20">
          <span>9:41</span>
          <div className="flex items-center space-x-1.5">
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Screen Area */}
        <div className="flex-1 bg-slate-900 rounded-[24px] sm:rounded-[36px] overflow-hidden flex flex-col relative text-slate-100 mt-1">
          {/* SCREEN: YOUTUBE APP WITH FOCUS SHIELD */}
          {activeScreen === 'youtube' && (
            isYouTubeDeactivated ? (
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-950 space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-2xl">
                  <ShieldAlert className="w-9 h-9 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/40">
                    Deactivated Package
                  </span>
                  <h3 className="text-base font-black text-white mt-2">
                    YouTube is Locked Out
                  </h3>
                  <p className="text-xs text-rose-300 font-mono mt-0.5">
                    com.google.android.youtube
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed max-w-[260px]">
                  You turned OFF YouTube in App Disabler. All video streaming, searches, and playback are completely blocked on this device.
                </div>
                <button
                  onClick={() => setActiveScreen('home')}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg transition-all"
                >
                  Return to Home Screen
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-y-auto">
                {/* YouTube App Top Bar */}
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
                  <div className="flex items-center space-x-2">
                    <Youtube className="w-5 h-5 text-red-500" />
                    <span className="font-bold text-xs tracking-tight">YouTube</span>
                  </div>
                  {focusRule?.isActive && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {focusRule.targetTopic ? focusRule.targetTopic.slice(0, 15) : 'Focus Lock'}
                    </span>
                  )}
                </div>

              {/* YouTube Search Bar & Category Chips */}
              <div className="p-2.5 bg-slate-900 border-b border-slate-800 space-y-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleMobileSearch(searchQuery);
                  }}
                  className="relative flex items-center"
                >
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search real YouTube videos & topics..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-8 pr-8 py-1.5 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        handleMobileSearch('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </form>

                {/* Mobile Subtopic Chips */}
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[10px] scrollbar-none">
                  {['All', 'Graph Algorithms', 'Trees', 'DP', 'Sorting'].map((chip) => {
                    const isSelected = (!activeMobileQuery && chip === 'All') || activeMobileQuery.toLowerCase() === chip.toLowerCase() || (chip === 'Graph Algorithms' && activeMobileQuery.toLowerCase().includes('graph'));
                    return (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          if (chip === 'All') {
                            setSearchQuery('');
                            handleMobileSearch('');
                          } else if (chip === 'Graph Algorithms') {
                            setSearchQuery('Graph Algorithms');
                            handleMobileSearch('Graph Algorithms');
                          } else {
                            setSearchQuery(chip);
                            handleMobileSearch(chip);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Mobile Video Player */}
              {selectedMobileVideo && (
                <div className="bg-black p-2 border-b border-slate-800">
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-950">
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedMobileVideo.youtubeId}?autoplay=1&rel=0&playsinline=1`}
                      title={selectedMobileVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                  <div className="mt-2 text-left flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">
                        {selectedMobileVideo.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {selectedMobileVideo.channelTitle} • {selectedMobileVideo.views}
                      </span>
                    </div>
                    <button
                      onClick={handleExternalYouTubeClick}
                      className="text-[10px] px-2 py-1 rounded bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 whitespace-nowrap font-medium flex items-center gap-1 cursor-pointer"
                      title={focusRule?.isActive ? "Focus Guarded: External YouTube Link" : "Open YouTube"}
                    >
                      <span>YouTube</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Feed */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                {activeMobileQuery ? (
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[10px]">
                    <div className="flex items-center space-x-1.5 text-slate-300 truncate">
                      <Search className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span className="truncate">
                        YouTube: <strong>&ldquo;{activeMobileQuery}&rdquo;</strong>
                      </span>
                      <span className="text-slate-500 font-mono">({mobileVideos.length})</span>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        handleMobileSearch('');
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold shrink-0 ml-1"
                    >
                      Reset
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {focusRule?.isActive ? `${focusRule.targetTopic || 'Focus'} Feed` : 'All Videos'}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-medium">
                      {mobileVideos.length} videos
                    </span>
                  </div>
                )}

                {isMobileSearching && (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    <span>Searching YouTube live...</span>
                  </div>
                )}

                {mobileVideos
                  .map((video) => {
                    const evalResult = evaluateVideoAgainstRule(video, focusRule);
                    const isBlocked = focusRule?.isActive && !evalResult.isAllowed;

                    return (
                      <div
                        key={video.id}
                        onClick={() => handleMobileVideoTap(video)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex space-x-2.5 ${
                          isBlocked
                            ? 'bg-slate-950/60 border-rose-950/40 opacity-70'
                            : 'bg-slate-800/80 border-slate-700/60 hover:border-indigo-500/40'
                        }`}
                      >
                        <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => handleThumbnailError(e, video.youtubeId, video.title, video.subtopic)}
                            className={`w-full h-full object-cover ${
                              isBlocked ? 'filter grayscale' : ''
                            }`}
                          />
                          <span className="absolute bottom-1 right-1 px-1 bg-black/80 text-[8px] font-mono rounded">
                            {video.duration}
                          </span>
                          {isBlocked && (
                            <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                              <Lock className="w-3.5 h-3.5 text-rose-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between py-0.5">
                          <h4 className="text-[11px] font-semibold text-white line-clamp-2 leading-tight">
                            {video.title}
                          </h4>
                          <div className="flex items-center justify-between text-[9px] text-slate-400">
                            <span className="truncate max-w-[90px]">{video.channelTitle}</span>
                            {isBlocked ? (
                              <span className="text-rose-400 font-bold">Locked</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">✓ Allowed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )
        )}

        {/* SCREEN: HOME SCREEN WITH APP GRID */}
          {activeScreen === 'home' && (
            <div className="flex-1 flex flex-col p-4 justify-between bg-gradient-to-b from-slate-900 via-indigo-950/30 to-slate-950 overflow-y-auto">
              <div className="space-y-4">
                {/* Simulated Widget */}
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-left shadow-lg">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Screen Time Today</span>
                    <span className="text-emerald-400 font-bold font-mono">2h 22m</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Focus Intent Active</span>
                    <span className="text-indigo-400 font-mono">
                      {focusRule?.isActive ? formatTime(focusRule.remainingSeconds) : 'Off'}
                    </span>
                  </div>
                </div>

                {/* App Grid */}
                <div className="grid grid-cols-4 gap-y-4 gap-x-2 text-center">
                  {apps.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => handleAppTap(app)}
                      className="flex flex-col items-center group relative focus:outline-none"
                    >
                      <div className="relative w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-md group-active:scale-95 transition-transform">
                        {getAppIcon(app.iconName)}
                        {app.isBlocked && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center shadow">
                            <Lock className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-300 mt-1 font-medium truncate max-w-[64px]">
                        {app.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dock Bar */}
              <div className="p-2.5 rounded-3xl bg-slate-950/90 border border-slate-800 flex items-center justify-around mt-4 shadow-xl">
                <button
                  onClick={() => {
                    if (youtubeApp?.isBlocked) {
                      handleAppTap(youtubeApp);
                    } else {
                      setActiveScreen('youtube');
                    }
                  }}
                  className="p-1 relative"
                  title={isYouTubeDeactivated ? "YouTube (Deactivated)" : "YouTube"}
                >
                  <Youtube className="w-6 h-6 text-red-500" />
                  {isYouTubeDeactivated && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full flex items-center justify-center border border-slate-950">
                      <Lock className="w-2 h-2 text-white" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => {
                    const codeApp = apps.find((a) => a.id === 'app-vscode');
                    if (codeApp) handleAppTap(codeApp);
                    else setActiveScreen('home');
                  }}
                  className="p-1"
                  title="VS Code Workspace"
                >
                  <Code className="w-6 h-6 text-indigo-400" />
                </button>
                <button
                  onClick={() => {
                    const notesApp = apps.find((a) => a.id === 'app-notes');
                    if (notesApp) handleAppTap(notesApp);
                    else setActiveScreen('home');
                  }}
                  className="p-1"
                  title="Study Notes"
                >
                  <FileText className="w-6 h-6 text-amber-400" />
                </button>
                <button onClick={() => setActiveScreen('focus_guard')} className="p-1" title="Focus Guard">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: DISABLED / BLOCKED APP OVERLAY */}
          {activeScreen === 'blocked_app' && attemptedApp && (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-950 space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-2xl">
                <ShieldAlert className="w-9 h-9 animate-pulse" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/40">
                  {attemptedApp.dailyLimitMinutes > 0 && attemptedApp.usedTodayMinutes >= attemptedApp.dailyLimitMinutes
                    ? 'Daily Limit Exceeded'
                    : attemptedApp.isHardLocked
                    ? 'Hard Lock Enforced'
                    : 'App Deactivated'}
                </span>
                <h3 className="text-base font-black text-white mt-2">
                  {attemptedApp.name} is Locked Out
                </h3>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  {attemptedApp.packageName}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed max-w-[260px] text-left space-y-1.5">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>Launch Attempt Intercepted</span>
                </div>
                <p className="text-slate-400">
                  {attemptedApp.dailyLimitMinutes > 0 && attemptedApp.usedTodayMinutes >= attemptedApp.dailyLimitMinutes
                    ? `Time Quota Reached: You have reached the ${attemptedApp.dailyLimitMinutes}m daily budget for this app today. Access is halted.`
                    : attemptedApp.isHardLocked
                    ? `Strict Hard Lock: Access is denied until your focus session on "${focusRule?.targetTopic || 'DSA'}" completes.`
                    : `You deactivated this app in App Disabler to prevent distraction and habit loops.`}
                </p>
                <div className="pt-1.5 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                  <span>Usage: {attemptedApp.usedTodayMinutes}m / {attemptedApp.dailyLimitMinutes}m</span>
                  <span className="text-rose-400 font-semibold">Access: Denied</span>
                </div>
              </div>

              <div className="w-full space-y-2 max-w-[260px]">
                <button
                  onClick={() => {
                    const codeApp = apps.find((a) => !a.isBlocked && a.id === 'app-vscode');
                    if (codeApp) {
                      handleAppTap(codeApp);
                    } else {
                      setActiveScreen('home');
                    }
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all flex items-center justify-center gap-1.5"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Open Permitted VS Code</span>
                </button>

                <button
                  onClick={() => setActiveScreen('home')}
                  className="w-full py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
                >
                  Back to Home Screen
                </button>
              </div>
            </div>
          )}

          {/* SCREEN: PERMITTED RUNNING APP INTERFACE */}
          {activeScreen === 'running_app' && runningApp && (
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden animate-in fade-in">
              {/* App In-Screen Top Header */}
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setActiveScreen('home')}
                    className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                    title="Exit to Home Screen"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-xs text-white truncate max-w-[120px]">
                    {runningApp.name}
                  </span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Permitted Study App
                </span>
              </div>

              {/* App Interactive Workspace */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {runningApp.id === 'app-chrome' ? (
                  /* Simulated Chrome Browser with Tab Guardian */
                  <div className="space-y-3">
                    {/* URL Bar */}
                    <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <input
                        type="text"
                        value={browserInputUrl}
                        onChange={(e) => setBrowserInputUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const low = browserInputUrl.toLowerCase();
                            if (low.includes('reddit') || low.includes('instagram') || low.includes('twitter') || low.includes('tiktok')) {
                              playShieldBlockedChime();
                              setBrowserBlockedNotice(`FocusShield Intercepted "${browserInputUrl}": This tab is categorized as a disallowed distraction during your focus session.`);
                              onDistractionBlocked({
                                id: 'sim-tab-block',
                                youtubeId: '',
                                title: browserInputUrl,
                                channelTitle: 'Browser Tab Guardian',
                                category: 'entertainment',
                                description: 'Disallowed tab access',
                                duration: '0:00',
                                matchScore: 10,
                                isStudyRelevant: false
                              }, 'Disallowed Tab Domain Intercepted');
                            } else {
                              setBrowserBlockedNotice(null);
                            }
                          }
                        }}
                        placeholder="Type URL (e.g. leetcode.com or reddit.com)..."
                        className="flex-1 bg-transparent text-[11px] text-white font-mono focus:outline-none"
                      />
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        TAB
                      </span>
                    </div>

                    {/* Quick Tab Selector */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Open Tabs &amp; Navigation:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <button
                          onClick={() => {
                            setBrowserTab('leetcode');
                            setBrowserInputUrl('leetcode.com/problemset');
                            setBrowserBlockedNotice(null);
                          }}
                          className={`p-2 rounded-xl text-left border transition flex items-center justify-between ${
                            browserTab === 'leetcode' && !browserBlockedNotice
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-semibold">LeetCode</span>
                          <span className="text-[8px] font-bold text-emerald-400 uppercase">Allowed</span>
                        </button>

                        <button
                          onClick={() => {
                            setBrowserTab('github');
                            setBrowserInputUrl('github.com/algorithms');
                            setBrowserBlockedNotice(null);
                          }}
                          className={`p-2 rounded-xl text-left border transition flex items-center justify-between ${
                            browserTab === 'github' && !browserBlockedNotice
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-semibold">GitHub</span>
                          <span className="text-[8px] font-bold text-emerald-400 uppercase">Allowed</span>
                        </button>

                        <button
                          onClick={() => {
                            setBrowserTab('reddit');
                            setBrowserInputUrl('reddit.com/r/all');
                            playShieldBlockedChime();
                            setBrowserBlockedNotice('FocusShield Intercepted "reddit.com": This tab is categorized as a disallowed distraction during your study session.');
                            onDistractionBlocked({
                              id: 'sim-reddit-block',
                              youtubeId: '',
                              title: 'Reddit Tab',
                              channelTitle: 'Tab Guardian',
                              category: 'social',
                              description: 'Disallowed tab access',
                              duration: '0:00',
                              matchScore: 10,
                              isStudyRelevant: false
                            }, 'Disallowed Tab Domain: Reddit');
                          }}
                          className="p-2 rounded-xl text-left border bg-slate-900 border-rose-900/60 text-slate-300 hover:border-rose-500/60 transition flex items-center justify-between"
                        >
                          <span className="font-semibold">Reddit</span>
                          <span className="text-[8px] font-bold text-rose-400 uppercase">Disallowed</span>
                        </button>

                        <button
                          onClick={() => {
                            setBrowserTab('instagram');
                            setBrowserInputUrl('instagram.com');
                            playShieldBlockedChime();
                            setBrowserBlockedNotice('FocusShield Intercepted "instagram.com": This tab is categorized as a disallowed distraction during your study session.');
                            onDistractionBlocked({
                              id: 'sim-ig-block',
                              youtubeId: '',
                              title: 'Instagram Tab',
                              channelTitle: 'Tab Guardian',
                              category: 'social',
                              description: 'Disallowed tab access',
                              duration: '0:00',
                              matchScore: 5,
                              isStudyRelevant: false
                            }, 'Disallowed Tab Domain: Instagram');
                          }}
                          className="p-2 rounded-xl text-left border bg-slate-900 border-rose-900/60 text-slate-300 hover:border-rose-500/60 transition flex items-center justify-between"
                        >
                          <span className="font-semibold">Instagram</span>
                          <span className="text-[8px] font-bold text-rose-400 uppercase">Disallowed</span>
                        </button>
                      </div>
                    </div>

                    {/* Tab Viewport */}
                    {browserBlockedNotice ? (
                      <div className="p-4 rounded-2xl bg-rose-950/60 border-2 border-rose-500/60 text-center space-y-2.5 animate-in fade-in">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                          <ShieldAlert className="w-5 h-5 animate-bounce" />
                        </div>
                        <h4 className="text-xs font-black text-white">
                          Tab Access Intercepted
                        </h4>
                        <p className="text-[10px] text-slate-300 leading-relaxed">
                          {browserBlockedNotice}
                        </p>
                        <button
                          onClick={() => {
                            setBrowserTab('leetcode');
                            setBrowserInputUrl('leetcode.com/problemset');
                            setBrowserBlockedNotice(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition"
                        >
                          Switch to Allowed LeetCode Tab
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-white flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            {browserTab === 'leetcode' ? 'LeetCode Problemset' : 'GitHub Algorithmic Repos'}
                          </span>
                          <span className="text-emerald-400 font-bold uppercase text-[8px]">
                            Tab Verified
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {browserTab === 'leetcode'
                            ? 'Permitted educational domain. Solve problems directly while Tab Guardian monitors background tab activity.'
                            : 'Permitted developer repository. Documentation and code samples verified for active study session.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : runningApp.id === 'app-vscode' || runningApp.category === 'education' ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono">
                      <span>twoSum.ts</span>
                      <button
                        onClick={() => {
                          setMiniCodeOutput("Running test cases...\n✓ Test 1: [0, 1] Passed (2ms)\n✓ Test 2: [1, 2] Passed (3ms)\nAll tests passed!");
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Run Test</span>
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[10px] text-indigo-200 leading-relaxed overflow-x-auto">
                      <p className="text-slate-500">// Problem: Two Sum (Hash Map)</p>
                      <p className="text-pink-400">function <span className="text-amber-300">twoSum</span>(nums, target) &#123;</p>
                      <p className="pl-2">const map = new Map();</p>
                      <p className="pl-2">for (let i=0; i&lt;nums.length; i++) &#123;</p>
                      <p className="pl-4">const diff = target - nums[i];</p>
                      <p className="pl-4">if (map.has(diff)) return [map.get(diff), i];</p>
                      <p className="pl-4">map.set(nums[i], i);</p>
                      <p className="pl-2">&#125;</p>
                      <p className="text-pink-400">&#125;</p>
                    </div>

                    {miniCodeOutput && (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 font-mono text-[10px] text-emerald-300 whitespace-pre-line">
                        {miniCodeOutput}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Quick Study Notes</span>
                    </div>
                    <textarea
                      defaultValue={`# DSA Session Log\n- Mastered BFS Graph Traversal\n- Time Complexity: O(V + E)\n- Next: Dijkstra's Shortest Path`}
                      rows={8}
                      className="w-full rounded-xl bg-slate-900 border border-slate-800 p-2.5 text-[11px] font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCREEN: FOCUS GUARD MASTER SCREEN */}
          {activeScreen === 'focus_guard' && (
            <div className="flex-1 p-5 flex flex-col justify-between text-center bg-slate-950">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    FocusShield Engine
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                    Active
                  </span>
                </div>

                <div className="py-4 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20 bg-slate-900">
                    <span className="text-2xl font-black font-mono text-white">
                      {focusRule ? formatTime(focusRule.remainingSeconds) : '45:00'}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">
                      Remaining
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 mt-3">
                    {focusRule?.targetTopic}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
                    {focusRule?.ruleSummary}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveScreen('youtube')}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
              >
                Launch Filtered YouTube
              </button>
            </div>
          )}
        </div>

        {/* Bottom Navigation Bar */}
        <div className="h-10 flex items-center justify-around text-slate-400 px-6 pt-1 z-20">
          <button
            onClick={() => setActiveScreen('home')}
            className={`p-1.5 rounded-xl transition-colors ${
              activeScreen === 'home' ? 'text-indigo-400' : 'hover:text-white'
            }`}
            title="Home"
          >
            <Home className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (youtubeApp?.isBlocked) {
                handleAppTap(youtubeApp);
              } else {
                setActiveScreen('youtube');
              }
            }}
            className={`p-1.5 rounded-xl transition-colors relative ${
              activeScreen === 'youtube' ? 'text-red-400' : 'hover:text-white'
            }`}
            title={isYouTubeDeactivated ? "YouTube (Deactivated)" : "YouTube DSA"}
          >
            <Youtube className="w-4 h-4" />
            {isYouTubeDeactivated && (
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-600 rounded-full flex items-center justify-center">
                <Lock className="w-1.5 h-1.5 text-white" />
              </div>
            )}
          </button>
          <button
            onClick={() => setActiveScreen('focus_guard')}
            className={`p-1.5 rounded-xl transition-colors ${
              activeScreen === 'focus_guard' ? 'text-emerald-400' : 'hover:text-white'
            }`}
            title="Focus Guard"
          >
            <ShieldCheck className="w-4 h-4" />
          </button>
        </div>

        {/* In-Phone Distraction Intercept Modal */}
        {mobileBlockedAlert && (
          <div className="absolute inset-0 bg-black/92 backdrop-blur-sm z-50 p-5 flex flex-col justify-center items-center text-center space-y-3.5 rounded-[44px] animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-900">
              FocusShield Mobile Guard
            </span>
            <h3 className="text-xs font-bold text-white px-2 leading-snug">
              {mobileBlockedAlert.video.title}
            </h3>
            <p className="text-[11px] text-rose-300 px-3 leading-relaxed">
              {mobileBlockedAlert.reason}
            </p>
            <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-[10px] text-indigo-300 w-full">
              Active Focus Target: <strong>{focusRule?.targetTopic || 'Study Topic'}</strong>
            </div>
            <button
              onClick={() => setMobileBlockedAlert(null)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
            >
              Return to Allowed Videos
            </button>
          </div>
        )}

        {/* External YouTube Lockdown Modal for Mobile */}
        {selectedMobileVideo && (
          <ExternalLockdownGuardianModal
            video={selectedMobileVideo}
            focusRule={focusRule}
            isOpen={showMobileGuardianModal}
            onClose={() => setShowMobileGuardianModal(false)}
            onContinueSafePlayer={() => setShowMobileGuardianModal(false)}
            onLoggedBypass={() => {
              onDistractionBlocked(
                selectedMobileVideo,
                `External YouTube link tapped on mobile: User requested external navigation during active "${focusRule?.targetTopic || 'Focus'}" lockdown.`
              );
            }}
          />
        )}
      </div>
    </div>
  );
};
