import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  AlertOctagon,
  X,
  Smartphone,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Code,
  Brain,
  Instagram,
  Youtube,
  Twitter,
  MessageSquare,
  Gamepad2,
  Tv
} from 'lucide-react';
import { AppItem, FocusIntentRule } from '../types';

interface RealAppLockoutModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
  focusRule: FocusIntentRule | null;
  onSwitchToAllowedApp: (appName: string) => void;
  onReactivateApp?: (appId: string) => void;
}

export const RealAppLockoutModal: React.FC<RealAppLockoutModalProps> = ({
  app,
  isOpen,
  onClose,
  focusRule,
  onSwitchToAllowedApp,
  onReactivateApp
}) => {
  const [showOverrideAttempt, setShowOverrideAttempt] = useState(false);
  const [overrideMathAnswer, setOverrideMathAnswer] = useState('');
  const [overrideFeedback, setOverrideFeedback] = useState<string | null>(null);

  if (!isOpen || !app) return null;

  const targetTopic = focusRule?.targetTopic || 'Data Structures & Algorithms';
  const remainingMins = focusRule?.remainingSeconds ? Math.ceil(focusRule.remainingSeconds / 60) : 45;

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'Youtube':
        return <Youtube className="w-8 h-8 text-red-500" />;
      case 'Instagram':
        return <Instagram className="w-8 h-8 text-pink-500" />;
      case 'Twitter':
        return <Twitter className="w-8 h-8 text-sky-400" />;
      case 'MessageSquare':
        return <MessageSquare className="w-8 h-8 text-orange-500" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-8 h-8 text-amber-500" />;
      case 'Tv':
        return <Tv className="w-8 h-8 text-rose-500" />;
      default:
        return <Smartphone className="w-8 h-8 text-rose-400" />;
    }
  };

  const handleAttemptUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (app.isHardLocked) {
      setOverrideFeedback('LOCKDOWN ENFORCED: Hard lock cannot be bypassed during an active focus block. Stay locked in!');
      return;
    }

    // Math challenge for soft-locked deactivations
    if (overrideMathAnswer.trim() === '73') {
      if (onReactivateApp) {
        onReactivateApp(app.id);
      }
      setOverrideFeedback('App reactivated. Remember your study goals!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setOverrideFeedback('Incorrect answer. FocusShield lockout remains strictly enforced.');
    }
  };

  return (
    <div
      id="real-app-lockout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-rose-500/50 rounded-3xl shadow-2xl shadow-rose-950/60 overflow-hidden text-slate-100">
        {/* Urgent Lockout Top Banner */}
        <div className="bg-gradient-to-r from-rose-950/90 via-red-900/60 to-slate-950 border-b border-rose-500/30 p-5 flex items-start gap-4">
          <div className="relative w-14 h-14 rounded-2xl bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center shrink-0 shadow-lg">
            <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse" />
            <div className="absolute -bottom-1 -right-1 p-1 bg-rose-600 rounded-full text-white shadow">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                App Deactivated &amp; Locked Out
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
              Launch Denied: {app.name}
            </h3>
            <p className="text-xs text-rose-300/90 mt-0.5">
              FocusShield Policy: Application is deactivated to prevent involuntary distraction.
            </p>
          </div>
        </div>

        {/* Lockout Details Body */}
        <div className="p-6 space-y-5">
          {/* Target App Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                {getAppIcon(app.iconName)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  {app.name}
                  {app.isHardLocked && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                      HARD LOCKED
                    </span>
                  )}
                </h4>
                <p className="text-xs font-mono text-slate-400">
                  {app.packageName}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Category: <span className="capitalize text-slate-300 font-semibold">{app.category}</span> • {app.usedTodayMinutes}m recorded today
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Disabled
              </span>
            </div>
          </div>

          {/* Strict Policy Statement */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>Security Interception Active</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              You scheduled deep focus on <strong className="text-white">{targetTopic}</strong>. FocusShield intercepted this launch attempt and safely returned your device to lockdown mode.
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Remaining Focus: {remainingMins} mins</span>
              <span className="text-emerald-400">Streak Protected ✓</span>
            </div>
          </div>

          {/* Override / Reactivate Attempt Section */}
          {showOverrideAttempt ? (
            <form onSubmit={handleAttemptUnlock} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  Intentional Unlock Challenge
                </span>
                <button
                  type="button"
                  onClick={() => setShowOverrideAttempt(false)}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {app.isHardLocked ? (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
                  <strong>Strict Hard Lockout:</strong> This app was designated as Hard Locked. No overrides or mathematical shortcuts are permitted until the active focus countdown reaches zero.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">
                    To prevent impulsive tapping, solve this verification before modifying lock policy:
                  </p>
                  <p className="text-xs font-mono font-bold text-amber-300">
                    What is (8 &times; 9) + 1 = ?
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={overrideMathAnswer}
                      onChange={(e) => setOverrideMathAnswer(e.target.value)}
                      placeholder="Enter answer..."
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
                    >
                      Verify &amp; Reactivate
                    </button>
                  </div>
                </div>
              )}

              {overrideFeedback && (
                <p className="text-xs font-semibold text-rose-400 mt-1">
                  {overrideFeedback}
                </p>
              )}
            </form>
          ) : (
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowOverrideAttempt(true)}
                className="text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Reactivation Challenge</span>
              </button>
              <span className="text-[11px] text-slate-500">
                Intercepted &amp; recorded in telemetry
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Stay Disciplined (Close Lockout)</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onSwitchToAllowedApp('VS Code');
              }}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Code className="w-4 h-4 text-indigo-400" />
              <span>Launch Allowed Coding App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
