import React, { useState } from 'react';
import {
  Code,
  Play,
  CheckCircle2,
  X,
  FileText,
  Brain,
  Terminal,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { AppItem } from '../types';

interface ActiveAppSandboxModalProps {
  app: AppItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveAppSandboxModal: React.FC<ActiveAppSandboxModalProps> = ({
  app,
  isOpen,
  onClose
}) => {
  const [code, setCode] = useState(`// Two Sum: Find two numbers that sum up to target
function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test cases:
console.log("Output:", twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
console.log("Output:", twoSum([3, 2, 4], 6));       // Expected: [1, 2]
`);

  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [notes, setNotes] = useState(`# Dynamic Programming & DSA Notes
- **Memoization**: Top-down approach caching recursive results.
- **Tabulation**: Bottom-up table filling from base cases.
- **State Transition**: dp[i] = Math.max(dp[i-1], dp[i-2] + nums[i])
- Daily Goal: Solve 2 Medium LeetCode problems before 6 PM.
`);

  if (!isOpen || !app) return null;

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setOutput(`[Running] ts-node solution.ts
[Compilation] Success (0 warnings)
Output: [0, 1]
Output: [1, 2]
------------------------------------
Test Suite: 2 passed, 2 total
Memory: 42.4 MB
Runtime: 3ms (beats 94.2% of submissions) ✓`);
      setIsRunning(false);
    }, 600);
  };

  const isCodingApp = app.id === 'app-vscode' || app.category === 'education' || app.name.toLowerCase().includes('code');
  const isNotesApp = app.name.toLowerCase().includes('note') || app.name.toLowerCase().includes('obsidian');

  return (
    <div
      id="active-app-sandbox-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
        {/* Window Top Bar */}
        <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {app.name}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Permitted Study Application
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {isCodingApp ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span>solution.ts &bull; TypeScript Algorithm Workspace</span>
                </div>
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isRunning ? 'Executing...' : 'Run Code'}</span>
                </button>
              </div>

              {/* Code Editor */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 shadow-inner">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  rows={11}
                  className="w-full bg-transparent resize-none focus:outline-none font-mono leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Execution Console Output */}
              {output && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800 text-[10px]">
                    <span className="flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-slate-500" />
                      TERMINAL OUTPUT
                    </span>
                    <span className="text-emerald-400 font-bold">EXIT CODE 0</span>
                  </div>
                  <pre className="whitespace-pre-wrap leading-relaxed mt-1 font-mono">
                    {output}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>StudyNotes.md &bull; Markdown Vault</span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Auto-saved
                </span>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={12}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-none shadow-inner"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
            Allowed under FocusShield policy (Productive / Educational)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Minimize &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
};
