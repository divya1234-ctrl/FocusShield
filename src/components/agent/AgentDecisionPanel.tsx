import React from 'react';
import {
  BrainCircuit,
  Eye,
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
  ArrowRight
} from 'lucide-react';
import { AgentDecisionRecord, AgentExecutionStatus, AgentActionType } from '../../types';

interface AgentDecisionPanelProps {
  status: AgentExecutionStatus;
  lastDecision: AgentDecisionRecord | null;
  currentTask: string;
  progressPercent: number;
  nextAction: AgentActionType;
  onManualTriggerAction?: (action: AgentActionType) => void;
}

export const AgentDecisionPanel: React.FC<AgentDecisionPanelProps> = ({
  status,
  lastDecision,
  currentTask,
  progressPercent,
  nextAction,
  onManualTriggerAction
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'planning':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 animate-pulse">
            <Compass className="w-3.5 h-3.5" /> Planning Curriculum
          </span>
        );
      case 'evaluating':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <Eye className="w-3.5 h-3.5" /> Evaluating Understanding
          </span>
        );
      case 'adapting':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Adapting Plan
          </span>
        );
      case 'recovering':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" /> Recovering Tool
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" /> Goal Achieved
          </span>
        );
      case 'executing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <Zap className="w-3.5 h-3.5" /> Executing Study Plan
          </span>
        );
    }
  };

  const formatActionBadge = (action: AgentActionType) => {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-xs px-2.5 py-1 rounded-md bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 font-bold tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        {action}
      </span>
    );
  };

  return (
    <div
      id="agent-decision-panel"
      className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-4"
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Agent Decision Engine
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400">
              Observe → Decide → Act → Evaluate → Adapt → Repeat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block">Agent Confidence</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {lastDecision?.confidence ? `${Math.round(lastDecision.confidence * 100)}%` : '96%'}
            </span>
          </div>
          <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60 hidden sm:block">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Decision Engine Content Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        {/* Observation Block */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Current Observation</span>
          </div>
          <p className="text-slate-200 font-medium leading-relaxed">
            {lastDecision?.observation ||
              `Monitoring user engagement on: "${currentTask}". Digital study environment actively protected.`}
          </p>
        </div>

        {/* Decision Block */}
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center space-x-1.5 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
            <BrainCircuit className="w-3.5 h-3.5 text-amber-400" />
            <span>Decision</span>
          </div>
          <p className="text-slate-200 font-medium leading-relaxed">
            {lastDecision?.decision ||
              'Execute current planned step, check comprehension milestones, and restrict non-essential tabs.'}
          </p>
        </div>
      </div>

      {/* Action and Reason Footer Bar */}
      <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
            Next Action:
          </span>
          {formatActionBadge(nextAction)}
        </div>

        <div className="flex items-center space-x-2 text-slate-300 min-w-0">
          <span className="text-slate-500 shrink-0">Reason:</span>
          <span className="italic truncate font-normal text-slate-300">
            {lastDecision?.reason || 'Aligning study plan progression with real-time learner capability.'}
          </span>
        </div>
      </div>
    </div>
  );
};
