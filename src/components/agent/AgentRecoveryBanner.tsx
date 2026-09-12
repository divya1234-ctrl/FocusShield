import React from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Server, ArrowRight } from 'lucide-react';
import { AgentRecoveryState } from '../../types';

interface AgentRecoveryBannerProps {
  recoveryState: AgentRecoveryState | null;
  onDismiss?: () => void;
}

export const AgentRecoveryBanner: React.FC<AgentRecoveryBannerProps> = ({
  recoveryState,
  onDismiss
}) => {
  if (!recoveryState || !recoveryState.isRecovering) return null;

  return (
    <div
      id="agent-recovery-banner"
      className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/30 border border-amber-500/50 shadow-xl space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>⚠ Resource Provider Unavailable</span>
              <span className="font-mono text-[11px] text-amber-400 font-normal">
                ({recoveryState.failedToolName})
              </span>
            </h4>
            <p className="text-xs text-slate-300">
              {recoveryState.failureReason}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {recoveryState.isResolved ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <CheckCircle2 className="w-3.5 h-3.5" /> Status: RECOVERED ✓
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Executing Recovery Protocol...
            </span>
          )}
        </div>
      </div>

      {/* Recovery Steps Visual Pipeline */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Autonomous Recovery Strategy:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
            <span className="text-rose-200">1. Remote Retry (Attempt 1)</span>
            <span className="text-[10px] font-mono font-bold text-rose-400">FAILED ✕</span>
          </div>

          <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between">
            <span className="text-indigo-200">2. Alternative Provider</span>
            <span className="text-[10px] font-mono font-bold text-indigo-400">SELECTED ✓</span>
          </div>

          <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <span className="text-emerald-200">3. Local Mirror Loaded</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">ACTIVE ✓</span>
          </div>
        </div>

        {recoveryState.fallbackResourceLoaded && (
          <div className="text-[11px] text-slate-300 flex items-center space-x-1.5 pt-1">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Fallback Resource:</span>
            <span className="font-semibold text-emerald-300 font-mono">
              {recoveryState.fallbackResourceLoaded}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
