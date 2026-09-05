import React, { useState } from 'react';
import { ShieldAlert, ExternalLink, Play, Lock, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { VideoItem, FocusIntentRule } from '../types';

interface ExternalLockdownGuardianModalProps {
  video: VideoItem;
  focusRule: FocusIntentRule | null;
  isOpen: boolean;
  onClose: () => void;
  onContinueSafePlayer: () => void;
  onLoggedBypass: () => void;
}

export const ExternalLockdownGuardianModal: React.FC<ExternalLockdownGuardianModalProps> = ({
  video,
  focusRule,
  isOpen,
  onClose,
  onContinueSafePlayer,
  onLoggedBypass
}) => {
  const [showOverrideInput, setShowOverrideInput] = useState(false);
  const [overrideText, setOverrideText] = useState('');
  const [overrideError, setOverrideError] = useState('');

  if (!isOpen) return null;

  const targetTopic = focusRule?.targetTopic || 'Active Focus Subject';
  const remainingMins = focusRule?.remainingSeconds ? Math.ceil(focusRule.remainingSeconds / 60) : 25;

  const handleOpenIsolatedPlayer = () => {
    // Isolated embed URL without related recommendations or algorithmic sidebars
    const isolatedUrl = `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`;
    window.open(isolatedUrl, '_blank', 'noopener,noreferrer,width=960,height=540');
    onClose();
  };

  const handleConfirmOverride = () => {
    if (overrideText.trim().toUpperCase() !== 'BREAK FOCUS') {
      setOverrideError('Please type "BREAK FOCUS" exactly to confirm intentional override.');
      return;
    }
    onLoggedBypass();
    window.open(`https://www.youtube.com/watch?v=${video.youtubeId}`, '_blank', 'noopener,noreferrer');
    setShowOverrideInput(false);
    setOverrideText('');
    setOverrideError('');
    onClose();
  };

  return (
    <div
      id="external-lockdown-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-950/70 via-red-950/50 to-slate-900 border-b border-amber-500/30 p-5 flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                FocusShield Lockdown Active
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              External YouTube Navigation Intercepted
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              Session locked onto <span className="font-semibold text-amber-300">{targetTopic}</span> ({remainingMins} min remaining)
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <p className="font-medium text-slate-200">
                Opening raw YouTube removes all protection:
              </p>
              <p>
                Unshielded YouTube displays addictive recommendations, algorithmic sidebars, and short-form loops engineered to divert you from <strong className="text-white">{targetTopic}</strong>.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
            <img
              src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
              alt={video.title}
              className="w-20 h-12 object-cover rounded-lg shrink-0 border border-slate-700"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{video.title}</p>
              <p className="text-[11px] text-slate-400 truncate">{video.channelTitle}</p>
            </div>
          </div>

          {/* Action options */}
          <div className="space-y-3 pt-2">
            <button
              id="stay-in-shield-btn"
              onClick={() => {
                onContinueSafePlayer();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-900/30"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Stay in FocusShield Safe Player (Recommended)</span>
            </button>

            <button
              id="open-isolated-player-btn"
              onClick={handleOpenIsolatedPlayer}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-medium text-xs rounded-xl transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Isolated Sandbox Window (Zero Recommendations)</span>
            </button>

            {!showOverrideInput ? (
              <button
                id="show-override-btn"
                onClick={() => setShowOverrideInput(true)}
                className="w-full text-center text-[11px] text-slate-500 hover:text-slate-400 py-1 transition underline decoration-dotted"
              >
                I require unshielded YouTube (Intentional Friction Gate)
              </button>
            ) : (
              <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl space-y-2 animate-in fade-in">
                <p className="text-xs text-red-300 font-medium">
                  Type <span className="font-mono font-bold text-white">BREAK FOCUS</span> to acknowledge breaking your study protection:
                </p>
                <div className="flex gap-2">
                  <input
                    id="override-input"
                    type="text"
                    value={overrideText}
                    onChange={(e) => {
                      setOverrideText(e.target.value);
                      setOverrideError('');
                    }}
                    placeholder="Type BREAK FOCUS"
                    className="flex-1 bg-slate-900 border border-slate-700 text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-red-400 font-mono uppercase"
                  />
                  <button
                    id="confirm-override-btn"
                    onClick={handleConfirmOverride}
                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition shrink-0"
                  >
                    Confirm & Open
                  </button>
                </div>
                {overrideError && <p className="text-[11px] text-red-400">{overrideError}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
