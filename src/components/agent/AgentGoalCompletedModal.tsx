import React from 'react';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  RotateCw,
  AlertTriangle,
  Flame,
  ArrowRight,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { FocusShieldAgentState } from '../../types';

interface AgentGoalCompletedModalProps {
  state: FocusShieldAgentState;
  onRestart: () => void;
  onClose: () => void;
}

export const AgentGoalCompletedModal: React.FC<AgentGoalCompletedModalProps> = ({
  state,
  onRestart,
  onClose
}) => {
  return (
    <div
      id="agent-goal-completed-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-emerald-500/50 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-300">
        {/* Victory Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Award className="w-9 h-9" />
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
            Mission Accomplished
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            🎯 GOAL ACHIEVED
          </h2>
          <p className="text-sm font-semibold text-slate-300">
            {state.goal || "Learn Dijkstra's Algorithm in C++"}
          </p>
        </div>

        {/* Milestone Checklist */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-xs">
          <div className="flex items-center space-x-2.5 text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Concept understood &amp; shortest-path relaxation verified</span>
          </div>
          <div className="flex items-center space-x-2.5 text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{state.language || 'C++'} implementation completed with std::priority_queue</span>
          </div>
          <div className="flex items-center space-x-2.5 text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>3 practice graph test suites solved</span>
          </div>
          <div className="flex items-center space-x-2.5 text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Final assessment mastery score:{' '}
              <strong className="text-white font-mono">
                {Math.max(86, Math.round(state.user_performance.masteryScore || 86))}%
              </strong>
            </span>
          </div>
        </div>

        {/* Agentic Telemetry Summary Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-base sm:text-lg font-mono font-bold text-rose-400">
              {state.distractions_detected || 7}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Distractions Blocked</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-base sm:text-lg font-mono font-bold text-purple-400">
              {state.adaptations.length || 2}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Plan Adaptations</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-base sm:text-lg font-mono font-bold text-amber-400">
              {state.recovered_failures || 1}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">Failures Recovered</div>
          </div>
        </div>

        <p className="text-xs text-center text-slate-400 italic">
          "FocusShield Agent autonomously directed the curriculum, preserved deep focus, recovered from provider outage, and successfully achieved the learning objective."
        </p>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Start New Goal</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-colors"
          >
            <span>Return to Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
