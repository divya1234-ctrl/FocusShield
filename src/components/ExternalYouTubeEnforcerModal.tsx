import React, { useState } from 'react';
import {
  ShieldAlert,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  X,
  Laptop
} from 'lucide-react';

interface ExternalYouTubeEnforcerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUrlModal?: () => void;
}

export const ExternalYouTubeEnforcerModal: React.FC<ExternalYouTubeEnforcerModalProps> = ({
  isOpen,
  onClose,
  onOpenUrlModal
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeEnforcerTab, setActiveEnforcerTab] = useState<'script' | 'mobile' | 'url'>('script');

  if (!isOpen) return null;

  const redirectScriptCode = `// ==UserScript==
// @name         FocusShield YouTube Lockdown Enforcer
// @namespace    https://focusshield.ai
// @version      1.0
// @description  Redirects raw YouTube visits directly into your FocusShield Intent Protected Workspace
// @match        *://*.youtube.com/*
// @run-at       document-start
// ==/UserScript==

// If visiting raw unshielded YouTube, bounce directly to your FocusShield portal
if (window.location.hostname.includes('youtube.com')) {
  window.stop();
  window.location.replace(window.location.origin.includes('ais-') ? window.location.href : '${window.location.origin}');
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(redirectScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  return (
    <div
      id="external-youtube-enforcer-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border-b border-indigo-500/30 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Universal Protection Guide
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                How FocusShield Protects External YouTube
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Why FocusShield only directly stops in-browser content */}
        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-3 text-xs text-amber-200/90 shrink-0">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-300 font-semibold">Web Sandbox Architecture:</strong> Modern browsers isolate websites so they cannot spy on or shut down external apps on your phone or computer. To enforce FocusShield on external YouTube (apps and other browser tabs), use one of the 3 setup options below:
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-2 gap-1.5 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveEnforcerTab('script')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeEnforcerTab === 'script'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>1. Auto-Redirect Userscript (PC/Mac)</span>
          </button>
          <button
            onClick={() => setActiveEnforcerTab('mobile')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeEnforcerTab === 'mobile'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>2. Android / iOS Native Lockout</span>
          </button>
          <button
            onClick={() => setActiveEnforcerTab('url')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeEnforcerTab === 'url'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>3. External URL Gatekeeper</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeEnforcerTab === 'script' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                Install a free extension like <strong>Violentmonkey</strong> or <strong>Tampermonkey</strong> (Chrome, Edge, Firefox, Brave, Kiwi Browser). Add this script to automatically bounce <em>any</em> visit to <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded">youtube.com</code> into FocusShield!
              </div>

              <div className="relative">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-t-xl border-t border-x border-slate-800 text-[11px] text-slate-400">
                  <span className="font-mono">focusshield-enforcer.user.js</span>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-b-xl bg-slate-950 text-indigo-200 text-xs font-mono overflow-x-auto border-b border-x border-slate-800 max-h-52">
                  {redirectScriptCode}
                </pre>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
                <span>Once active, raw YouTube is completely blocked in your browser.</span>
                <button
                  onClick={handleCopyScript}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                >
                  {copiedScript ? 'Copied to Clipboard' : 'Copy 1-Click Script'}
                </button>
              </div>
            </div>
          )}

          {activeEnforcerTab === 'mobile' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400" />
                  Android OS Native Lockdown
                </h4>
                <ol className="list-decimal pl-4 space-y-2 text-slate-300">
                  <li>Open <strong>Settings → Digital Wellbeing & Parental Controls</strong>.</li>
                  <li>Tap <strong>App Timers</strong> and locate <strong>YouTube</strong>.</li>
                  <li>Set the timer to <strong>0 minutes</strong> or tap <strong>Pause App</strong>.</li>
                  <li>Open this FocusShield web app in Chrome and tap <strong>Menu (⋮) → Add to Home Screen / Install App</strong>.</li>
                </ol>
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  ✓ The native YouTube app is now dead on your phone. You use FocusShield as your sole intent-filtered YouTube player!
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  iOS Screen Time Setup
                </h4>
                <ol className="list-decimal pl-4 space-y-2 text-slate-300">
                  <li>Go to <strong>Settings → Screen Time → App Limits</strong>.</li>
                  <li>Add Limit for <strong>YouTube</strong> and set to <strong>1 minute</strong> with "Block at End of Limit" enabled.</li>
                  <li>In Safari, tap <strong>Share → Add to Home Screen</strong> for FocusShield.</li>
                </ol>
              </div>
            </div>
          )}

          {activeEnforcerTab === 'url' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  External URL Intent Inspector
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  If someone sends you a YouTube link or you find a video, paste it into FocusShield's URL Inspector. FocusShield scans the video with Gemini and immediately terminates it if it fails your focus goal or if your daily quota is exceeded.
                </p>
                {onOpenUrlModal && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenUrlModal();
                    }}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Open External Video URL Inspector Now</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
