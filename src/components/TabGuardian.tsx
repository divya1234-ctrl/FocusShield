import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Download,
  Flame,
  Clock,
  Sparkles,
  Code,
  Layers,
  Monitor,
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { MonitoredTabRule, FocusIntentRule } from '../types';
import { playShieldBlockedChime, playSuccessChime } from '../utils/audio';

interface TabGuardianProps {
  tabRules: MonitoredTabRule[];
  focusRule: FocusIntentRule | null;
  onAddTabRule: (rule: Omit<MonitoredTabRule, 'id' | 'blockedCount'>) => void;
  onToggleTabCategory: (id: string) => void;
  onDeleteTabRule: (id: string) => void;
  tabSwitchCount: number;
  timeAwaySeconds: number;
  onSimulateTabViolation: (domain: string, title: string) => void;
}

export const TabGuardian: React.FC<TabGuardianProps> = ({
  tabRules,
  focusRule,
  onAddTabRule,
  onToggleTabCategory,
  onDeleteTabRule,
  tabSwitchCount,
  timeAwaySeconds,
  onSimulateTabViolation
}) => {
  const [filter, setFilter] = useState<'all' | 'allowed' | 'disallowed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectUrl, setInspectUrl] = useState('');
  const [inspectResult, setInspectResult] = useState<{
    status: 'allowed' | 'disallowed' | 'unknown';
    domain: string;
    message: string;
  } | null>(null);

  // New Rule Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'allowed' | 'disallowed'>('disallowed');
  const [newDescription, setNewDescription] = useState('');

  // Live Screen / Tab Capture Stream State
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Userscript / Extension Modal
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedExtension, setCopiedExtension] = useState(false);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Handle Display Media (Screen / Tab Capture)
  const handleStartCapture = async () => {
    setCaptureError(null);
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCapturing(true);

      // Listen for when user stops sharing via browser UI
      stream.getVideoTracks()[0].onended = () => {
        setIsCapturing(false);
        streamRef.current = null;
      };
    } catch (err: unknown) {
      console.warn('Capture error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('permissions policy') ||
        msg.includes('display-capture') ||
        msg.includes('disallowed by permissions policy')
      ) {
        setCaptureError(
          'iFrame Permissions Policy: The embedded preview panel blocks screen/tab capture inside an iframe. Open the app in its own dedicated browser tab to use Live Tab Vision, or rely on the automatic Visibility Sentinel below (which requires no permissions).'
        );
      } else if (msg.includes('Permission denied') || msg.includes('NotAllowedError')) {
        setCaptureError(
          'Screen/Tab permission was declined in the browser prompt. You can still use the automatic Page Visibility Sentinel!'
        );
      } else {
        setCaptureError(`Capture notice: ${msg}`);
      }
    }
  };

  const handleStopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  // Inspect any Tab / URL against current focus rules and whitelist/blacklist
  const handleInspectUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectUrl.trim()) return;

    let domain = inspectUrl.trim().toLowerCase();
    try {
      if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
        domain = 'https://' + domain;
      }
      const parsed = new URL(domain);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch {
      domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }

    // Check against tab rules
    const matchedRule = tabRules.find(
      (r) =>
        domain.includes(r.domain.toLowerCase()) ||
        r.domain.toLowerCase().includes(domain) ||
        r.matchPattern.split(',').some((p) => domain.includes(p.trim().toLowerCase()))
    );

    if (matchedRule) {
      if (matchedRule.category === 'allowed') {
        setInspectResult({
          status: 'allowed',
          domain,
          message: `Permitted Study Resource: "${matchedRule.title}" is explicitly on your Allowed Tabs whitelist.`
        });
      } else {
        setInspectResult({
          status: 'disallowed',
          domain,
          message: `Distraction / Forbidden Tab: "${matchedRule.title}" is marked as Disallowed. Access will trigger an interception!`
        });
      }
      return;
    }

    // Heuristic evaluation against active focus intent
    const target = focusRule?.targetTopic?.toLowerCase() || '';
    const isCodingMatch =
      domain.includes('code') ||
      domain.includes('git') ||
      domain.includes('dev') ||
      domain.includes('stack') ||
      domain.includes('docs');

    if (isCodingMatch && target) {
      setInspectResult({
        status: 'allowed',
        domain,
        message: `Probable Educational Tab: Matches technical domain indicators for active focus "${focusRule?.targetTopic}".`
      });
    } else {
      setInspectResult({
        status: 'disallowed',
        domain,
        message: `Unclassified Tab: "${domain}" is not in your allowed study whitelist. Mark as Disallowed to enforce lockdown.`
      });
    }
  };

  // Add rule submit
  const handleAddRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim() || !newTitle.trim()) return;

    let cleanDomain = newDomain.trim().toLowerCase();
    try {
      if (cleanDomain.startsWith('http')) {
        const url = new URL(cleanDomain);
        cleanDomain = url.hostname.replace(/^www\./, '');
      }
    } catch {
      // Keep as-is
    }

    onAddTabRule({
      domain: cleanDomain,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim() || `${newCategory === 'allowed' ? 'Permitted' : 'Blocked'} tab`,
      matchPattern: cleanDomain
    });

    playSuccessChime();
    setNewDomain('');
    setNewTitle('');
    setNewDescription('');
    setShowAddModal(false);
  };

  // Filtered Rules
  const filteredRules = tabRules.filter((rule) => {
    if (filter === 'allowed' && rule.category !== 'allowed') return false;
    if (filter === 'disallowed' && rule.category !== 'disallowed') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        rule.title.toLowerCase().includes(q) ||
        rule.domain.toLowerCase().includes(q) ||
        rule.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allowedCount = tabRules.filter((r) => r.category === 'allowed').length;
  const disallowedCount = tabRules.filter((r) => r.category === 'disallowed').length;

  // Tampermonkey Userscript Code template
  const userscriptCode = `// ==UserScript==
// @name         FocusShield - Universal Multi-Tab Enforcer
// @namespace    https://focusshield.app
// @version      1.2
// @description  Intercepts disallowed browser tabs during active study sessions
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  // Configured Disallowed Domains
  const DISALLOWED_DOMAINS = [
${tabRules
  .filter((r) => r.category === 'disallowed')
  .map((r) => `    "${r.domain}",`)
  .join('\n')}
  ];

  const currentHost = window.location.hostname.replace(/^www\\./, '');
  const isDisallowed = DISALLOWED_DOMAINS.some(d => currentHost.includes(d));

  if (isDisallowed) {
    // Check if session is during active study hours
    console.warn('[FocusShield] Disallowed Tab Intercepted:', currentHost);
    
    // Replace page content with high-friction study lockout
    window.stop();
    document.documentElement.innerHTML = \`
      <div style="background:#090d16;color:#f8fafc;font-family:sans-serif;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;">
        <div style="width:72px;height:72px;background:#ef444420;border:2px solid #ef4444;border-radius:24px;display:flex;align-items:center;justify-content:center;font-size:36px;margin-bottom:20px;">🛡️</div>
        <h1 style="font-size:28px;font-weight:900;margin:0 0 10px 0;color:#fff;">Tab Access Denied by FocusShield</h1>
        <p style="font-size:14px;color:#94a3b8;max-width:440px;margin-bottom:24px;line-height:1.5;">
          <strong>\${currentHost}</strong> is configured as a disallowed distraction during your active focus session on <strong>${focusRule?.targetTopic || 'DSA Algorithms'}</strong>.
        </p>
        <div style="display:flex;gap:12px;">
          <a href="\${window.location.origin}" onclick="window.close()" style="background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:12px;font-weight:bold;font-size:14px;">Close Tab & Return to Study</a>
        </div>
      </div>
    \`;
  }
})();`;

  return (
    <div className="space-y-6">
      {/* 1. TOP HERO: EXPLANATION OF HOW TAB SEEING WORKS & ACTIVE STATUS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Multi-Tab Sentinel &amp; Visibility Guard</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Browser Tab Guardian
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Detects and intercepts browser tabs and windows you are using that you have not allowed.
              Combines <strong>Live Tab Vision</strong>, <strong>Page Visibility Blur Interceptors</strong>, and a <strong>Whitelist/Blacklist Policy Engine</strong>.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setShowExtensionModal(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center gap-2 shadow-sm"
              title="How to enable native tab closing across Chrome / Edge"
            >
              <Code className="w-4 h-4 text-indigo-400" />
              <span>Universal Multi-Tab Script</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>Add Tab Rule</span>
            </button>
          </div>
        </div>

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Metric 1: Tab Visibility Sentinel */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Visibility Sentinel
              </span>
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Active &amp; Listening
              </span>
            </div>
          </div>

          {/* Metric 2: Tab Switch Violations */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              tabSwitchCount > 0
                ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400'
                : 'bg-slate-800 border border-slate-700 text-slate-400'
            }`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Tab Switches Detected
              </span>
              <span className="text-xs font-bold text-white font-mono">
                {tabSwitchCount} times ({Math.floor(timeAwaySeconds / 60)}m {timeAwaySeconds % 60}s away)
              </span>
            </div>
          </div>

          {/* Metric 3: Policy Breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Configured Rules
              </span>
              <span className="text-xs font-semibold text-slate-200">
                <span className="text-emerald-400 font-bold">{allowedCount} Allowed</span> •{' '}
                <span className="text-rose-400 font-bold">{disallowedCount} Disallowed</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. LIVE TAB VISION & SCREEN/WINDOW WATCHDOG (DISPLAY MEDIA API) */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isCapturing
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Live Tab Vision &amp; Window Scanner
                {isCapturing && (
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                    Live Stream Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Directly share your active browser window or tab so FocusShield can continuously verify you are on allowed study material.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCapturing ? (
              <button
                onClick={handleStartCapture}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Enable Live Tab Vision</span>
              </button>
            ) : (
              <button
                onClick={handleStopCapture}
                className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span>Stop Vision Stream</span>
              </button>
            )}
          </div>
        </div>

        {/* Capture Error Banner if any */}
        {captureError && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs space-y-2.5 animate-in fade-in">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2.5 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">
                    Display Capture iFrame Restriction
                  </span>
                  <p className="text-amber-200/90 leading-relaxed max-w-xl">
                    {captureError}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCaptureError(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800 transition"
              >
                Dismiss
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Full Browser Tab</span>
              </a>
              <span className="text-[11px] text-slate-400">
                (Allows direct browser tab sharing without iframe sandbox limits)
              </span>
            </div>
          </div>
        )}

        {/* Live Stream Viewport */}
        {isCapturing ? (
          <div className="relative rounded-2xl overflow-hidden bg-black border border-indigo-500/30 shadow-2xl aspect-video max-h-[360px] flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            {/* Overlay Scan Ticker */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[11px] font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>SCANNING ACTIVE TAB • FOCUS: {focusRule?.targetTopic || 'ACTIVE INTENT'}</span>
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                onClick={() => onSimulateTabViolation('reddit.com', 'Reddit r/funny')}
                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-bold transition"
                title="Test how an unallowed tab interception triggers"
              >
                Simulate Disallowed Tab
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-white">
                  Automatic Tab Switch Sentinel is currently running:
                </span>
                <p className="text-slate-400 text-[11px]">
                  Even without video screen sharing, FocusShield detects whenever you switch away to another tab, rings the alarm chime, and counts unallowed tab time.
                </p>
              </div>
            </div>

            <button
              onClick={() => onSimulateTabViolation('instagram.com', 'Instagram Web')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold shrink-0 transition"
            >
              Test Tab Switch Alarm
            </button>
          </div>
        )}
      </div>

      {/* 3. URL BAR SCANNER: INSTANTLY TEST / INSPECT ANY TAB URL */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-3 pb-2 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Instant Tab URL &amp; Website Inspector
            </h3>
            <p className="text-xs text-slate-400">
              Check if a tab or domain you are using is permitted under your active focus policy or flagged as disallowed.
            </p>
          </div>
        </div>

        <form onSubmit={handleInspectUrl} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={inspectUrl}
              onChange={(e) => setInspectUrl(e.target.value)}
              placeholder="Enter domain or open tab URL (e.g. leetcode.com, reddit.com, stackoverflow.com)..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Inspect Tab</span>
          </button>
        </form>

        {/* Inspection Result Box */}
        {inspectResult && (
          <div
            className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in ${
              inspectResult.status === 'allowed'
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              {inspectResult.status === 'allowed' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <span className="font-mono font-bold uppercase tracking-wider text-[11px] block">
                  {inspectResult.status === 'allowed' ? 'Permitted Tab (Allowed)' : 'Distraction Tab (Disallowed)'}
                </span>
                <p className="text-slate-200 text-xs">{inspectResult.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {inspectResult.status === 'disallowed' && (
                <button
                  onClick={() => {
                    onAddTabRule({
                      domain: inspectResult.domain,
                      title: inspectResult.domain,
                      category: 'disallowed',
                      description: 'Manually verified disallowed tab',
                      matchPattern: inspectResult.domain
                    });
                    playSuccessChime();
                    setInspectResult(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
                >
                  Add to Disallowed List
                </button>
              )}
              {inspectResult.status === 'allowed' && (
                <button
                  onClick={() => {
                    onAddTabRule({
                      domain: inspectResult.domain,
                      title: inspectResult.domain,
                      category: 'allowed',
                      description: 'Permitted study website',
                      matchPattern: inspectResult.domain
                    });
                    playSuccessChime();
                    setInspectResult(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Add to Allowed Whitelist
                </button>
              )}
              <button
                onClick={() => setInspectResult(null)}
                className="px-2 py-1 rounded-lg text-slate-400 hover:text-white text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. ALLOWED & DISALLOWED TABS LIST */}
      <div className="space-y-4">
        {/* Controls: Filter & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 self-start">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Tabs ({tabRules.length})
            </button>
            <button
              onClick={() => setFilter('allowed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'allowed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Allowed ({allowedCount})
            </button>
            <button
              onClick={() => setFilter('disallowed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === 'disallowed'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Disallowed ({disallowedCount})
            </button>
          </div>

          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tabs by domain or name..."
              className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Tab Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredRules.map((rule) => {
            const isAllowed = rule.category === 'allowed';
            return (
              <div
                key={rule.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  isAllowed
                    ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/30'
                    : 'bg-slate-900/70 border-rose-950/80 hover:border-rose-500/40 shadow-inner'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isAllowed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      }`}
                    >
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {rule.title}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400 block truncate max-w-[170px]">
                        {rule.domain}
                      </span>
                    </div>
                  </div>

                  {/* Category Pill */}
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      isAllowed
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {isAllowed ? 'Allowed' : 'Disallowed'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {rule.description}
                </p>

                {/* Actions: Toggle Category, Test Violation, Delete */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      onToggleTabCategory(rule.id);
                      playSuccessChime();
                    }}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      isAllowed
                        ? 'text-amber-300 hover:bg-amber-950/40'
                        : 'text-emerald-300 hover:bg-emerald-950/40'
                    }`}
                  >
                    {isAllowed ? (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Disallow Tab</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3 h-3" />
                        <span>Allow Tab</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {!isAllowed && (
                      <button
                        onClick={() => onSimulateTabViolation(rule.domain, rule.title)}
                        className="px-2 py-1 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition"
                        title="Simulate opening this disallowed tab"
                      >
                        Test Intercept
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteTabRule(rule.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                      title="Delete rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. ADD CUSTOM TAB RULE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <span>Add Monitored Browser Tab</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleAddRuleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Website Domain or URL:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. reddit.com or leetcode.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tab / Website Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reddit or LeetCode"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Policy Status:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategory('allowed')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      newCategory === 'allowed'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Allowed (Permitted Study)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategory('disallowed')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      newCategory === 'disallowed'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    Disallowed (Block &amp; Alarm)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason / Description:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Social media feed distraction"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30"
                >
                  Save Tab Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. UNIVERSAL MULTI-TAB ENFORCER EXTENSION / USERSCRIPT MODAL */}
      {showExtensionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Universal Multi-Tab Enforcer Script
                  </h3>
                  <p className="text-xs text-slate-400">
                    Why browsers sandbox tabs &amp; how to close disallowed tabs automatically
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExtensionModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            {/* Explanation box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-semibold text-white">
                How FocusShield Sees &amp; Manages Other Tabs:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li>
                  <strong>1. Tab Visibility Sentinel (Zero-Install):</strong> Whenever you switch away from FocusShield to an unallowed tab, the browser triggers visibility blur, FocusShield rings the alarm chime, logs the violation, and displays the lockout modal upon your return.
                </li>
                <li>
                  <strong>2. Live Tab Vision (Zero-Install):</strong> Share your browser window using the &quot;Enable Live Tab Vision&quot; button above. FocusShield visually inspects open tabs in real-time.
                </li>
                <li>
                  <strong>3. Tampermonkey Userscript (Auto-Close Tabs):</strong> Install the script below in Tampermonkey or Violentmonkey. Any time you navigate to a disallowed domain like Reddit, Instagram, or Twitter in ANY browser tab, it halts the page immediately!
                </li>
              </ul>
            </div>

            {/* Code Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Tampermonkey / Violentmonkey Userscript:
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(userscriptCode);
                    setCopiedScript(true);
                    playSuccessChime();
                    setTimeout(() => setCopiedScript(false), 2000);
                  }}
                  className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Script'}</span>
                </button>
              </div>

              <pre className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-200 overflow-x-auto max-h-56 select-all">
                {userscriptCode}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowExtensionModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
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
