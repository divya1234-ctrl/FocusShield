import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, Clock, CheckCircle2, AlertTriangle, Zap, Lock, BookOpen } from 'lucide-react';
import { FocusIntentRule } from '../types';
import { INTENT_PRESETS } from '../data/mockMobileData';
import { playFocusStartChime } from '../utils/audio';

interface IntentLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRule: FocusIntentRule | null;
  onApplyRule: (rule: FocusIntentRule) => void;
}

// Helper to deduce topic title from free-form text
function extractTopicFromPrompt(text: string): { topic?: string; duration?: number } {
  const lower = text.toLowerCase();
  let topic: string | undefined;
  let duration: number | undefined;

  // Extract duration if present
  const durMatch = lower.match(/(\d+)\s*(min|minute|minutes|m|hour|hours|h)/i);
  if (durMatch) {
    let val = parseInt(durMatch[1], 10);
    if (durMatch[2].toLowerCase().startsWith('h')) val *= 60;
    duration = Math.min(Math.max(val, 5), 360);
  }

  // Topic recognition - check specific subtopics first before broad DSA
  if (lower.includes('machine learning') || lower.includes('deep learning') || lower.includes('neural') || lower.includes('artificial intelligence') || lower.includes(' ai ')) {
    topic = 'Machine Learning & AI';
  } else if (lower.includes('graph') || lower.includes('bfs') || lower.includes('dfs') || lower.includes('dijkstra') || lower.includes('topo') || lower.includes('kruskal') || lower.includes('bellman')) {
    topic = 'Graph Algorithms';
  } else if (lower.includes('dynamic programming') || lower.includes(' dp ') || lower.includes('knapsack') || lower.includes('memoization') || lower.includes('tabulation')) {
    topic = 'Dynamic Programming';
  } else if (lower.includes('system design') || lower.includes('distributed') || lower.includes('microservice') || lower.includes('scalability')) {
    topic = 'System Design & Architecture';
  } else if (lower.includes('web dev') || lower.includes('react') || lower.includes('fullstack') || lower.includes('next.js') || lower.includes('full stack') || lower.includes('node') || lower.includes('frontend')) {
    topic = 'Web Development & Fullstack';
  } else if (lower.includes('math') || lower.includes('calculus') || lower.includes('linear algebra') || lower.includes('physics')) {
    topic = 'Mathematics & Science';
  } else if (lower.includes('sorting') || lower.includes('mergesort') || lower.includes('quicksort') || lower.includes('divide and conquer')) {
    topic = 'Sorting & Divide and Conquer';
  } else if (lower.includes('tree') || lower.includes('trie') || lower.includes('binary tree') || lower.includes('bst')) {
    topic = 'Trees & Tries';
  } else if (lower.includes('two pointer') || lower.includes('sliding window')) {
    topic = 'Arrays & Two Pointers';
  } else if (lower.includes('python')) {
    topic = 'Python Mastery';
  } else if (lower.includes('dsa') || lower.includes('data structure') || lower.includes('leetcode') || lower.includes('algorithm')) {
    topic = 'Data Structures & Algorithms (DSA)';
  } else {
    // Try to extract phrase after "focus on", "study", "learn", "only allow", etc.
    const phraseMatch = text.match(/(?:focus on|study|learn|see|allow|practice)\s+([A-Za-z0-9\s&/()+-]{3,35}?)(?:\s+(?:for|then|and|with|\d+|$))/i);
    if (phraseMatch && phraseMatch[1]) {
      const extracted = phraseMatch[1].trim();
      if (extracted.length > 2 && !['only', 'video', 'videos', 'youtube'].includes(extracted.toLowerCase())) {
        topic = extracted.charAt(0).toUpperCase() + extracted.slice(1);
      }
    }
  }

  return { topic, duration };
}

export const IntentLockModal: React.FC<IntentLockModalProps> = ({
  isOpen,
  onClose,
  currentRule,
  onApplyRule,
}) => {
  const [prompt, setPrompt] = useState(
    currentRule?.userPrompt ||
      'I want to focus on Graph Algorithms for 45 minutes, disabling all other distracting YouTube videos.'
  );
  const [targetTopic, setTargetTopic] = useState(
    currentRule?.targetTopic || 'Graph Algorithms'
  );
  const [duration, setDuration] = useState<number>(currentRule?.durationMinutes || 45);
  const [strictness, setStrictness] = useState<'STRICT' | 'MODERATE'>('STRICT');
  const [targetPlatform, setTargetPlatform] = useState<'youtube_only' | 'all_apps'>('youtube_only');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewAnalysis, setPreviewAnalysis] = useState<Partial<FocusIntentRule> | null>(null);

  // Track modal open state transitions so the 1-second countdown timer in App does NOT wipe user inputs
  const prevIsOpenRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (currentRule) {
        setPrompt(currentRule.userPrompt || `I want to focus on ${currentRule.targetTopic} for ${currentRule.durationMinutes} minutes.`);
        setTargetTopic(currentRule.targetTopic || 'Graph Algorithms');
        setDuration(currentRule.durationMinutes || 45);
      }
      setPreviewAnalysis(null);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle typing in prompt: dynamically update targetTopic if matching
  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
    const { topic, duration: detectedDur } = extractTopicFromPrompt(newPrompt);
    if (topic) {
      setTargetTopic(topic);
    }
    if (detectedDur) {
      setDuration(detectedDur);
    }
    setPreviewAnalysis(null);
  };

  const handleAnalyzeIntent = async () => {
    if (!prompt.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/parse-focus-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewAnalysis(data);
        if (data.targetTopic) {
          setTargetTopic(data.targetTopic);
        }
        if (data.durationMinutes) {
          setDuration(data.durationMinutes);
        }
      }
    } catch (err) {
      console.error('Error analyzing intent:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePresetClick = (presetPrompt: string, presetDuration: number, presetTopic?: string) => {
    setPrompt(presetPrompt);
    setDuration(presetDuration);
    if (presetTopic) {
      setTargetTopic(presetTopic);
    } else {
      const { topic } = extractTopicFromPrompt(presetPrompt);
      if (topic) setTargetTopic(topic);
    }
    setPreviewAnalysis(null);
  };

  const handleTopicPillClick = (topicName: string) => {
    setTargetTopic(topicName);
    setPrompt(`I want to focus strictly on ${topicName} for ${duration} minutes, disabling all other distracting YouTube videos.`);
    setPreviewAnalysis(null);
  };

  const handleStartSession = () => {
    const totalSecs = duration * 60;
    
    // Check if the prompt has a topic that user just typed
    const { topic: detectedFromPrompt } = extractTopicFromPrompt(prompt);
    const finalTopic = targetTopic.trim() || previewAnalysis?.targetTopic || detectedFromPrompt || 'Custom Focus Goal';
    
    // Auto-derive keywords from user topic and prompt
    const topicWords = finalTopic.toLowerCase().split(/[\s,&/()+-]+/).filter(w => w.length > 2);
    const promptWords = prompt.toLowerCase().split(/[\s,&/()+-]+/).filter(w => w.length > 2 && !['want', 'only', 'video', 'videos', 'youtube', 'minutes', 'hours', 'then', 'other', 'all', 'apps', 'get', 'blocked', 'for', 'strictly'].includes(w));
    
    // Domain specific topic keywords helper
    const domainSpecificKeywords: string[] = [];
    const lowerTopic = finalTopic.toLowerCase();
    if (lowerTopic.includes('machine learning') || lowerTopic.includes(' ai') || lowerTopic.includes('neural') || lowerTopic.includes('deep learning')) {
      domainSpecificKeywords.push('machine learning', 'neural network', 'deep learning', 'pytorch', 'tensorflow', 'transformer', 'gpt', 'llm', 'linear algebra', 'backpropagation', 'gradient descent', 'ai');
    } else if (lowerTopic.includes('graph')) {
      domainSpecificKeywords.push('graph', 'bfs', 'dfs', 'dijkstra', 'bellman', 'kruskal', 'prim', 'topological sort', 'shortest path', 'adjacency', 'islands');
    } else if (lowerTopic.includes('dynamic programming') || lowerTopic.includes('dp')) {
      domainSpecificKeywords.push('dynamic programming', 'dp', 'knapsack', 'memoization', 'tabulation', 'subproblem');
    } else if (lowerTopic.includes('sorting') || lowerTopic.includes('divide')) {
      domainSpecificKeywords.push('sorting', 'mergesort', 'quicksort', 'heapsort', 'divide and conquer');
    } else if (lowerTopic.includes('tree') || lowerTopic.includes('trie')) {
      domainSpecificKeywords.push('tree', 'binary search tree', 'bst', 'trie', 'traversal', 'inorder');
    } else if (lowerTopic.includes('web') || lowerTopic.includes('react')) {
      domainSpecificKeywords.push('react', 'javascript', 'typescript', 'nextjs', 'fullstack', 'css', 'html', 'node', 'web dev');
    } else if (lowerTopic.includes('system design')) {
      domainSpecificKeywords.push('system design', 'architecture', 'scalability', 'microservices', 'load balancing', 'sharding', 'caching', 'redis', 'database');
    } else if (lowerTopic.includes('math') || lowerTopic.includes('science') || lowerTopic.includes('calculus')) {
      domainSpecificKeywords.push('math', 'linear algebra', 'calculus', 'physics', '3blue1brown');
    }

    const derivedAllowed = Array.from(new Set([
      finalTopic.toLowerCase(),
      ...domainSpecificKeywords,
      ...topicWords,
      ...promptWords,
      ...(previewAnalysis?.allowedKeywords || [])
    ]));

    const rule: FocusIntentRule = {
      id: `rule-${Date.now()}`,
      targetTopic: finalTopic,
      userPrompt: prompt,
      durationMinutes: duration,
      remainingSeconds: totalSecs,
      totalSeconds: totalSecs,
      isActive: true,
      isPaused: false,
      isCompleted: false,
      startTime: new Date().toISOString(),
      allowedKeywords: derivedAllowed.length > 0 ? derivedAllowed : [
        finalTopic.toLowerCase(),
        'tutorial',
        'course',
        'lecture',
        'walkthrough'
      ],
      bannedKeywords: previewAnalysis?.bannedKeywords || [
        'gaming',
        'vlog',
        'prank',
        'reaction',
        'trailer',
        'shorts',
        'entertainment',
        'comedy',
        'supercar',
        'minecraft'
      ],
      allowedSubtopics: previewAnalysis?.allowedSubtopics || [
        `${finalTopic} Fundamentals`,
        `Advanced ${finalTopic} Problem Solving`,
        'Step-by-Step Architecture & Walkthroughs',
        'Core Practical Implementations'
      ],
      ruleSummary:
        previewAnalysis?.ruleSummary ||
        `Strict focus lock on "${finalTopic}". All non-educational and off-topic content disabled for ${duration} mins.`,
      motivationalQuote:
        previewAnalysis?.motivationalQuote || `Focused execution on ${finalTopic} turns complex topics into intuitive mastery.`,
      strictness,
      distractionsBlockedCount: 0,
      videosWatchedCount: 0,
      targetPlatform,
    };

    playFocusStartChime();
    onApplyRule(rule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Configure AI Intent Focus Lock
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Gemini 3.7
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Type your custom topic or natural language goal to lock YouTube &amp; apps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-sm">
          {/* Quick Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Popular Focus Presets (Click to Load)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INTENT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handlePresetClick(preset.prompt, preset.duration, preset.topic)}
                  className={`flex items-center space-x-2 text-left p-2.5 rounded-xl border transition-all text-xs group ${
                    targetTopic === preset.topic
                      ? 'bg-indigo-900/60 border-indigo-500 text-white shadow-md'
                      : 'border-slate-800 bg-slate-800/60 hover:bg-indigo-950/40 hover:border-indigo-500/40 text-slate-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                  <span className="font-medium truncate">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Select Topic Pills */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Focus Domains
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Machine Learning & AI',
                'Graph Algorithms',
                'Data Structures & Algorithms',
                'Dynamic Programming',
                'Web Development & Fullstack',
                'System Design & Architecture',
                'Mathematics & Science',
                'Python Mastery'
              ].map((pill) => {
                const isSelected = targetTopic.toLowerCase() === pill.toLowerCase() || (pill.includes('Machine Learning') && targetTopic.toLowerCase().includes('machine learning'));
                return (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => handleTopicPillClick(pill)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/30'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Focus Topic (Directly Editable) */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-indigo-500/30">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Target Focus Topic (Active Lock Target)</span>
              </label>
              <span className="text-[11px] text-emerald-400 font-mono font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                Active: {targetTopic}
              </span>
            </div>
            <input
              type="text"
              value={targetTopic}
              onChange={(e) => {
                const newTopic = e.target.value;
                setTargetTopic(newTopic);
                setPrompt(`I want to focus on ${newTopic} for ${duration} minutes, then all other distracting YouTube videos and apps get blocked.`);
                setPreviewAnalysis(null);
              }}
              placeholder="e.g. Machine Learning & AI, Graph Algorithms, React Web Dev..."
              className="w-full rounded-xl bg-slate-900 border border-indigo-500/60 focus:border-indigo-400 p-2.5 text-xs text-emerald-300 font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Whatever you write or select here (e.g. <strong>Machine Learning &amp; AI</strong>, <strong>Graph Algorithms</strong>, <strong>System Design</strong>) will immediately become the active lock shown on your shield and top bar.
            </p>
          </div>

          {/* User Prompt Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Natural Language Focus Rule &amp; Scope
              </label>
              <button
                type="button"
                onClick={handleAnalyzeIntent}
                disabled={isAnalyzing}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <Sparkles className="w-3 h-3" />
                {isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze with AI'}
              </button>
            </div>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                rows={3}
                placeholder="e.g. I want to study Machine Learning & AI for 45 minutes then block all distracting YouTube videos..."
                className="w-full rounded-xl bg-slate-950 border border-slate-700 p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Session Duration
            </label>
            <div className="flex flex-wrap gap-2">
              {[15, 25, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setDuration(mins);
                    const { topic } = extractTopicFromPrompt(prompt);
                    const t = targetTopic || topic || 'Focus Topic';
                    setPrompt(`I want to focus on ${t} for ${mins} minutes, then all other distracting YouTube videos and apps get blocked.`);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    duration === mins
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{mins} mins</span>
                </button>
              ))}
            </div>
          </div>

          {/* Enforcement Scope & Strictness */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Scope */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Lockdown Scope
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={targetPlatform === 'all_apps'}
                    onChange={() => setTargetPlatform('all_apps')}
                    className="text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <span>Focus Lock + All Social Apps Disabled</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    checked={targetPlatform === 'youtube_only'}
                    onChange={() => setTargetPlatform('youtube_only')}
                    className="text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <span>YouTube Content Lock Only</span>
                </label>
              </div>
            </div>

            {/* Strictness */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Lockdown Strictness
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="strictness"
                    checked={strictness === 'STRICT'}
                    onChange={() => setStrictness('STRICT')}
                    className="text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3 text-rose-400" />
                    Strict (Friction challenge to unblock)
                  </span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
                  <input
                    type="radio"
                    name="strictness"
                    checked={strictness === 'MODERATE'}
                    onChange={() => setStrictness('MODERATE')}
                    className="text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <span>Moderate (Pause available anytime)</span>
                </label>
              </div>
            </div>
          </div>

          {/* AI Analyzed Preview Card */}
          {previewAnalysis && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-300">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  Target Topic: {previewAnalysis.targetTopic}
                </span>
                <span className="text-[11px] bg-indigo-900/60 px-2 py-0.5 rounded text-indigo-200">
                  {previewAnalysis.durationMinutes}m session
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                &ldquo;{previewAnalysis.motivationalQuote}&rdquo;
              </p>
              {previewAnalysis.allowedSubtopics && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {previewAnalysis.allowedSubtopics.map((sub, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/90 text-emerald-300 border border-emerald-500/20 font-medium"
                    >
                      ✓ {sub}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartSession}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:to-pink-700 text-white shadow-lg shadow-indigo-500/30 transition-all transform active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Engage Focus Intent Shield</span>
          </button>
        </div>
      </div>
    </div>
  );
};
