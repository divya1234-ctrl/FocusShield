import React, { useState } from 'react';
import {
  BookOpen,
  Code2,
  FileQuestion,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  HelpCircle,
  Play,
  RotateCcw,
  Copy,
  Check,
  Terminal,
  ShieldAlert,
  Lightbulb
} from 'lucide-react';
import {
  LearningResource,
  QuizQuestion,
  QuizAnswerEvaluation,
  StudyPlanTask
} from '../../types';

interface AgentActiveWorkspaceProps {
  currentTask: StudyPlanTask | null;
  resource: LearningResource | null;
  quiz: QuizQuestion | null;
  quizEvaluation: QuizAnswerEvaluation | null;
  activeExplanation: {
    title: string;
    concept: string;
    diagramAscii?: string;
    keyTakeaways: string[];
    exampleSnippet?: string;
  } | null;
  onAnswerQuiz: (questionId: string, optionId: string, correctOptionId: string) => void;
  onRequestExplanation: () => void;
  onNextQuiz: () => void;
}

export const AgentActiveWorkspace: React.FC<AgentActiveWorkspaceProps> = ({
  currentTask,
  resource,
  quiz,
  quizEvaluation,
  activeExplanation,
  onAnswerQuiz,
  onRequestExplanation,
  onNextQuiz
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'resource' | 'quiz' | 'explanation' | 'code'>('resource');
  const [compilerOutput, setCompilerOutput] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);

  // Automatically switch tab if quiz is active or explanation is triggered
  React.useEffect(() => {
    if (activeExplanation) {
      setActiveTab('explanation');
    } else if (currentTask?.type === 'quiz' || quiz) {
      setActiveTab('quiz');
    }
  }, [currentTask, activeExplanation, quiz]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRunCode = () => {
    setIsCompiling(true);
    setCompilerOutput(null);
    setTimeout(() => {
      setIsCompiling(false);
      setCompilerOutput(
        `[g++ -std=c++20 -O3 main.cpp -o solution]\nRunning Dijkstra shortest path verification...\n-----------------------------------------------\nNode count: 4, Edge count: 5\nSource: Node 0 (A)\nTarget: Node 3 (D)\n\n[Relaxation Pass]:\nRelaxed (A -> C) cost: 2\nRelaxed (C -> B) cost: 2 + 1 = 3  (Better than direct A->B=4!)\nRelaxed (B -> D) cost: 3 + 5 = 8\n\nShortest Path: A -> C -> B -> D\nTotal Distance: 8 units\nALL 5 ASSERTION TESTS PASSED [✓]`
      );
    }, 800);
  };

  return (
    <div
      id="agent-active-workspace"
      className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
    >
      {/* Workspace Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('resource')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'resource'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Curriculum Resource</span>
            {resource && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'quiz'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileQuestion className="w-3.5 h-3.5" />
            <span>Mastery Diagnostic Quiz</span>
            {quiz && !quizEvaluation && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('explanation')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'explanation'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Agent Explanation &amp; Invariants</span>
            {activeExplanation && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'code'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>C++ Implementation</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
          <span>Active Task:</span>
          <span className="text-white font-semibold truncate max-w-[200px]">
            {currentTask?.title || 'Dijkstra Foundations'}
          </span>
        </div>
      </div>

      {/* TAB 1: CURRICULUM RESOURCE */}
      {activeTab === 'resource' && (
        <div className="space-y-4">
          {resource ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {resource.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                      {resource.provider}
                    </span>
                    <span className="text-xs font-mono text-emerald-400">
                      Relevance: {Math.round(resource.relevance * 100)}%
                    </span>
                    {resource.isFallback && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Cached Local Mirror
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {resource.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {resource.summary}
                  </p>

                  {/* Key concepts */}
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1 pt-1">
                    <span className="text-[11px] text-slate-400 font-semibold">Key Concepts:</span>
                    {resource.keyConcepts.map((kc, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800/80 text-indigo-300 border border-slate-700 font-mono"
                      >
                        {kc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Resource Thumbnail / Link */}
                <div className="w-full sm:w-48 shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group relative">
                  {resource.thumbnail ? (
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                      className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-28 flex items-center justify-center bg-slate-900 text-slate-500">
                      <BookOpen className="w-8 h-8" />
                    </div>
                  )}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-xs font-bold text-white"
                  >
                    <span>Launch Resource</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Action bar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400 font-mono">
                  Estimated duration: {resource.duration} min
                </span>
                <button
                  onClick={() => setActiveTab('quiz')}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  <span>Ready for Assessment</span>
                  <Play className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                Agent is selecting optimal curriculum material for current task...
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTERY DIAGNOSTIC QUIZ */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {quiz ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Concept Check: {quiz.conceptTested}
                  </span>
                  <span className="text-xs text-slate-400">
                    Difficulty: <span className="capitalize text-slate-200">{quiz.difficulty}</span>
                  </span>
                </div>
                <button
                  onClick={onRequestExplanation}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Need Concept Hint
                </button>
              </div>

              <h4 className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                {quiz.question}
              </h4>

              {/* Code snippet if provided */}
              {quiz.codeSnippet && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto whitespace-pre">
                  {quiz.codeSnippet}
                </div>
              )}

              {/* Options */}
              <div className="space-y-2">
                {quiz.options.map(opt => {
                  const isSelected = selectedOption === opt.id;
                  const isAnswerEvaluated = quizEvaluation !== null;
                  const isCorrectAnswer = opt.id === quiz.correctOptionId;

                  let optClass =
                    'p-3 rounded-xl border text-xs text-left transition-all flex items-start justify-between gap-3 ';

                  if (isAnswerEvaluated) {
                    if (isCorrectAnswer) {
                      optClass += 'bg-emerald-950/30 border-emerald-500/60 text-emerald-200';
                    } else if (isSelected) {
                      optClass += 'bg-rose-950/30 border-rose-500/60 text-rose-200';
                    } else {
                      optClass += 'bg-slate-900/40 border-slate-800 text-slate-500';
                    }
                  } else if (isSelected) {
                    optClass +=
                      'bg-indigo-950/50 border-indigo-500/60 text-white ring-1 ring-indigo-500/40';
                  } else {
                    optClass +=
                      'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800/80 hover:border-slate-700 cursor-pointer';
                  }

                  return (
                    <button
                      key={opt.id}
                      disabled={isAnswerEvaluated}
                      onClick={() => setSelectedOption(opt.id)}
                      className={optClass}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="font-mono text-slate-400 font-bold">
                          {opt.id.slice(-1).toUpperCase()}.
                        </span>
                        <span className="font-medium">{opt.text}</span>
                      </div>

                      {isAnswerEvaluated && isCorrectAnswer && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {isAnswerEvaluated && isSelected && !isCorrectAnswer && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Evaluation Feedback */}
              {quizEvaluation && (
                <div
                  className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                    quizEvaluation.isCorrect
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {quizEvaluation.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Correct Assessment!
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" /> Conceptual Flaw Detected
                        </>
                      )}
                    </span>
                    <span className="font-mono text-[11px] font-semibold">
                      Mastery Score: {quizEvaluation.scoreDelta > 0 ? `+${quizEvaluation.scoreDelta}` : quizEvaluation.scoreDelta}
                    </span>
                  </div>
                  <p className="leading-relaxed">{quizEvaluation.conceptualFeedback}</p>
                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      onClick={onNextQuiz}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                    >
                      Continue to Next Assessment
                    </button>
                  </div>
                </div>
              )}

              {/* Submit button */}
              {!quizEvaluation && (
                <div className="flex justify-end">
                  <button
                    disabled={!selectedOption}
                    onClick={() => {
                      if (selectedOption) {
                        onAnswerQuiz(quiz.id, selectedOption, quiz.correctOptionId);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      selectedOption
                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Submit Answer for AI Evaluation
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <FileQuestion className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">
                Agent generates dynamic diagnostic questions based on current learning task...
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADAPTATION & RE-EXPLANATION */}
      {activeTab === 'explanation' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Adaptive Breakdown
                </span>
                <span className="text-xs font-bold text-white">
                  {activeExplanation?.title || "Shortest-Path Relaxation: The Core Invariant"}
                </span>
              </div>
            </div>

            {/* ASCII Graph Diagram */}
            {activeExplanation?.diagramAscii && (
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre">
                {activeExplanation.diagramAscii}
              </div>
            )}

            {/* Key Takeaways */}
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Why This Invariant Matters:
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {(activeExplanation?.keyTakeaways || [
                  'In Dijkstra, when a node is popped from the priority queue, its shortest distance is finalized.',
                  'Relaxation checks if dist[u] + weight(u, v) < dist[v].',
                  'If true, we update dist[v] and push the pair into the priority queue.',
                  'Non-negative weights guarantee that visiting new nodes will never decrease distances to already finalized nodes.'
                ]).map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Code template snippet */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>C++ Relaxation Loop:</span>
                <button
                  onClick={() =>
                    handleCopy(
                      activeExplanation?.exampleSnippet ||
                        `if (dist[u] + weight < dist[v]) {\n    dist[v] = dist[u] + weight;\n    pq.push({dist[v], v});\n}`
                    )
                  }
                  className="flex items-center space-x-1 text-slate-400 hover:text-white"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
                {activeExplanation?.exampleSnippet ||
                  `// Standard C++ Relaxation Loop\nfor (const auto& edge : adj[u]) {\n    int v = edge.to;\n    int weight = edge.weight;\n    if (dist[u] + weight < dist[v]) {\n        dist[v] = dist[u] + weight;\n        pq.push({dist[v], v});\n    }\n}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: C++ IMPLEMENTATION & VERIFICATION */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Dijkstra C++ Algorithm (Single-Source Shortest Path)
                </h4>
                <p className="text-[11px] text-slate-400">
                  Target Complexity: O((V + E) log V) with std::priority_queue
                </p>
              </div>
              <button
                onClick={handleRunCode}
                disabled={isCompiling}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{isCompiling ? 'Compiling C++...' : 'Run Test Harness'}</span>
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
{`#include <iostream>
#include <vector>
#include <queue>

using namespace std;

typedef pair<int, int> pii; // {distance, node}

vector<int> dijkstra(int n, vector<vector<pii>>& adj, int source) {
    vector<int> dist(n, 1e9);
    priority_queue<pii, vector<pii>, greater<pii>> pq;

    dist[source] = 0;
    pq.push({0, source});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (d > dist[u]) continue;

        for (auto& edge : adj[u]) {
            int v = edge.first;
            int weight = edge.second;

            // Relaxation step
            if (dist[u] + weight < dist[v]) {
                dist[v] = dist[u] + weight;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}`}
            </pre>

            {compilerOutput && (
              <div className="p-3 rounded-xl bg-black border border-emerald-500/40 font-mono text-[11px] text-emerald-400 whitespace-pre leading-relaxed">
                {compilerOutput}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
