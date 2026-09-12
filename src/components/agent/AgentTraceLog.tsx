import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Terminal, Activity, Sparkles, Filter } from 'lucide-react';
import { AgentTraceEntry } from '../../types';

interface AgentTraceLogProps {
  traces: AgentTraceEntry[];
  onClearTraces?: () => void;
}

export const AgentTraceLog: React.FC<AgentTraceLogProps> = ({ traces, onClearTraces }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterStage, setFilterStage] = useState<string>('ALL');

  const getStageBadge = (stage: AgentTraceEntry['stage']) => {
    switch (stage) {
      case 'OBSERVE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'EVALUATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'DECIDE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'ACT':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'ADAPT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'RECOVER':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const filteredTraces = traces.filter(t => filterStage === 'ALL' || t.stage === filterStage);

  return (
    <div
      id="agent-trace-panel"
      className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden transition-all"
    >
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition-colors select-none"
      >
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <Terminal className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Agent Trace Stream
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                {traces.length} steps logged
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Deterministic, concise action &amp; evaluation logs (no hidden chain-of-thought).
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            className="text-slate-400 hover:text-white p-1 rounded-lg"
            aria-label="Toggle trace expand"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Trace Body */}
      {isExpanded && (
        <div className="border-t border-slate-800 p-4 space-y-3 bg-slate-950/80">
          {/* Filter tabs */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
            <div className="flex items-center space-x-1.5">
              {['ALL', 'OBSERVE', 'EVALUATE', 'DECIDE', 'ACT', 'ADAPT', 'RECOVER'].map(stage => (
                <button
                  key={stage}
                  onClick={() => setFilterStage(stage)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition-all ${
                    filterStage === stage
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>

            {onClearTraces && traces.length > 0 && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  onClearTraces();
                }}
                className="text-[10px] text-slate-500 hover:text-slate-300"
              >
                Clear Log
              </button>
            )}
          </div>

          {/* Trace stream entries */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredTraces.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 font-mono">
                No traces recorded yet for this filter.
              </div>
            ) : (
              filteredTraces.map(trace => (
                <div
                  key={trace.id}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono space-y-1 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 font-bold">[{trace.timestamp}]</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border ${getStageBadge(
                          trace.stage
                        )}`}
                      >
                        {trace.stage}
                      </span>
                      <span className="text-slate-200 font-semibold">{trace.title}</span>
                    </div>

                    {trace.action && (
                      <span className="px-2 py-0.5 rounded bg-slate-950 text-indigo-300 border border-slate-800 text-[10px] font-bold">
                        {trace.action}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 pl-1 border-l-2 border-slate-800 font-sans leading-relaxed">
                    {trace.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
