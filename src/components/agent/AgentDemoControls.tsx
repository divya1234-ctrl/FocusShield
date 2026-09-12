import React from 'react';
import {
  Play,
  Pause,
  AlertTriangle,
  XCircle,
  RotateCw,
  FastForward,
  RotateCcw,
  Sparkles,
  Award
} from 'lucide-react';

interface AgentDemoControlsProps {
  isDemoRunning: boolean;
  currentDemoStepIndex: number;
  totalDemoSteps: number;
  currentStepDescription: string;
  onToggleDemo: () => void;
  onSimulateFailure: () => void;
  onSimulateWrongAnswer: () => void;
  onTriggerAdaptation: () => void;
  onStepForward: () => void;
  onResetSession: () => void;
  onTriggerCompletion: () => void;
}

export const AgentDemoControls: React.FC<AgentDemoControlsProps> = ({
  isDemoRunning,
  currentDemoStepIndex,
  totalDemoSteps,
  currentStepDescription,
  onToggleDemo,
  onSimulateFailure,
  onSimulateWrongAnswer,
  onTriggerAdaptation,
  onStepForward,
  onResetSession,
  onTriggerCompletion
}) => {
  return (
    <div
      id="agent-demo-controls"
      className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 shadow-xl space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Hackathon Demo Mode
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Step {currentDemoStepIndex + 1} of {totalDemoSteps}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              Active Phase: <span className="text-white font-semibold">{currentStepDescription}</span>
            </p>
          </div>
        </div>

        {/* Primary Play/Pause and Step buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleDemo}
            className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              isDemoRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
            }`}
          >
            {isDemoRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause Demo</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>▶ Start Demo (Auto Walkthrough)</span>
              </>
            )}
          </button>

          <button
            onClick={onStepForward}
            title="Step to next phase"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            onClick={onResetSession}
            title="Reset session to start"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Manual Hackathon Triggers Bar */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Judge Interactive Triggers:
        </span>

        {/* Trigger 1: Simulate Resource Failure */}
        <button
          onClick={onSimulateFailure}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-200 font-semibold transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>⚠ Simulate Resource Failure</span>
        </button>

        {/* Trigger 2: Simulate Wrong Answer */}
        <button
          onClick={onSimulateWrongAnswer}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 text-rose-200 font-semibold transition-colors"
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>❌ Simulate Wrong Answer</span>
        </button>

        {/* Trigger 3: Trigger Adaptation */}
        <button
          onClick={onTriggerAdaptation}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 font-semibold transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5 text-purple-400" />
          <span>🔄 Trigger Adaptation</span>
        </button>

        {/* Trigger 4: Instant Goal Completion Screen */}
        <button
          onClick={onTriggerCompletion}
          className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-200 font-semibold transition-colors ml-auto"
        >
          <Award className="w-3.5 h-3.5 text-emerald-400" />
          <span>🎯 Show Final Result Screen</span>
        </button>
      </div>
    </div>
  );
};
