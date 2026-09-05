import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Flame,
  Globe
} from 'lucide-react';
import { FocusIntentRule } from '../types';
import { playSuccessChime } from '../utils/audio';

interface UnauthorizedTabModalProps {
  isOpen: boolean;
  onClose: () => void;
  secondsAway: number;
  focusRule: FocusIntentRule | null;
  onWhitelistTab: (domain: string, title: string) => void;
  onConfirmDistraction: (reason: string) => void;
  onNavigateToTabGuardian: () => void;
}

export const UnauthorizedTabModal: React.FC<UnauthorizedTabModalProps> = ({
  isOpen,
  onClose,
  secondsAway,
  focusRule,
  onWhitelistTab,
  onConfirmDistraction,
  onNavigateToTabGuardian
}) => {
  const [declaredDomain, setDeclaredDomain] = useState('');
  const [showWhitelistForm, setShowWhitelistForm] = useState(false);

  if (!isOpen) return null;

  const targetTopic = focusRule?.targetTopic || 'Active Study Subject';

  const handleWhitelistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaredDomain.trim()) return;

    let clean = declaredDomain.trim().toLowerCase();
    try {
      if (clean.startsWith('http')) {
        const u = new URL(clean);
        clean = u.hostname.replace(/^www\./, '');
      }
    } catch {
      // Keep as-is
    }

    onWhitelistTab(clean, clean);
    playSuccessChime();
    setDeclaredDomain('');
    setShowWhitelistForm(false);
    onClose();
  };

  return (
    <div
      id="unauthorized-tab-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-slate-900 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Banner */}
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 text-[10px] font-black uppercase tracking-wider">
              <AlertTriangle className="w-3 h-3" />
              <span>Unauthorized Tab Switch Intercepted</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              FocusShield Detected Tab Navigation
            </h3>
            <p className="text-xs text-slate-400">
              You left your active study session on{' '}
              <strong className="text-indigo-300 font-semibold">{targetTopic}</strong>.
            </p>
          </div>
        </div>

        {/* Metrics Banner */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Time Away on Other Tab:</span>
            <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
              {secondsAway} seconds
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Focus Session Policy:</span>
            <span className="text-slate-200 font-medium">Strict Study Lock</span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
            Switching to unallowed browser tabs breaks deep work flow and triggers distraction loops. FocusShield records tab switch violations to protect your study discipline.
          </p>
        </div>

        {/* Options */}
        {!showWhitelistForm ? (
          <div className="space-y-2.5">
            <button
              onClick={() => {
                onConfirmDistraction(`Switched away to unmonitored tab for ${secondsAway}s`);
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
            >
              <span>Accept Distraction &amp; Return to Study</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowWhitelistForm(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>I was using an allowed study tab (Add to Whitelist)</span>
            </button>

            <button
              onClick={() => {
                onNavigateToTabGuardian();
                onClose();
              }}
              className="w-full py-2 text-center text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
            >
              Configure Allowed &amp; Disallowed Tabs in Tab Guardian &rarr;
            </button>
          </div>
        ) : (
          <form onSubmit={handleWhitelistSubmit} className="space-y-3 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Enter the domain you were using:
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. leetcode.com, github.com, stackoverflow.com"
                value={declaredDomain}
                onChange={(e) => setDeclaredDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowWhitelistForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
              >
                Add as Permitted Tab
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
