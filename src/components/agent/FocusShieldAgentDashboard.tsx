import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  BrainCircuit,
  Sparkles,
  Clock,
  Flame,
  Award,
  ShieldAlert,
  RotateCcw,
  Play,
  RotateCw,
  Eye,
  Zap,
  Activity,
  CheckCircle2
} from 'lucide-react';
import {
  FocusShieldAgentState,
  StudyPlanTask,
  LearningResource,
  QuizQuestion,
  QuizAnswerEvaluation,
  AgentDecisionRecord,
  AgentTraceEntry,
  AgentActionType,
  AgentDomainRule,
  AgentRecoveryState,
  AgentPlanAdaptationRecord
} from '../../types';
import { AgentDecisionPanel } from './AgentDecisionPanel';
import { AgentStudyPlan } from './AgentStudyPlan';
import { AgentActiveWorkspace } from './AgentActiveWorkspace';
import { AgentDistractionFilterTool } from './AgentDistractionFilterTool';
import { AgentRecoveryBanner } from './AgentRecoveryBanner';
import { AgentTraceLog } from './AgentTraceLog';
import { AgentDemoControls } from './AgentDemoControls';
import { AgentGoalCompletedModal } from './AgentGoalCompletedModal';

const DEFAULT_ALLOWED_DOMAINS: AgentDomainRule[] = [
  { domain: 'youtube.com', label: 'YouTube (DSA & Computer Science Only)', reason: 'Educational Video Streams', category: 'video', isAllowed: true, hitsCount: 14 },
  { domain: 'leetcode.com', label: 'LeetCode & Explore Modules', reason: 'Interactive Graph Problems', category: 'coding', isAllowed: true, hitsCount: 6 },
  { domain: 'geeksforgeeks.org', label: 'GeeksForGeeks Documentation', reason: 'C++ Syntax & Complexity Specs', category: 'docs', isAllowed: true, hitsCount: 3 },
  { domain: 'mit.edu', label: 'MIT OpenCourseWare (6.006)', reason: 'Theoretical Graph Analysis', category: 'academic', isAllowed: true, hitsCount: 1 }
];

const DEFAULT_BLOCKED_DOMAINS: AgentDomainRule[] = [
  { domain: 'instagram.com', label: 'Instagram (Reels & Feed)', reason: 'Algorithmic Infinite Scroll', category: 'social', isAllowed: false, hitsCount: 4 },
  { domain: 'reddit.com', label: 'Reddit (r/all, r/gaming, r/memes)', reason: 'Discussion Feeds', category: 'social', isAllowed: false, hitsCount: 2 },
  { domain: 'twitch.tv', label: 'Twitch & Gaming Streams', reason: 'Entertainment Broadcasts', category: 'gaming', isAllowed: false, hitsCount: 1 },
  { domain: 'youtube.com/shorts', label: 'YouTube Shorts (Non-Educational)', reason: 'Dopamine Loop Interception', category: 'entertainment', isAllowed: false, hitsCount: 3 }
];

export const FocusShieldAgentDashboard: React.FC = () => {
  const [goalInput, setGoalInput] = useState("Learn Dijkstra's algorithm in C++ in 60 minutes");
  const [isInitializingGoal, setIsInitializingGoal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Core Agent State
  const [agentState, setAgentState] = useState<FocusShieldAgentState>({
    goal: "Learn Dijkstra's Algorithm in C++ in 60 minutes",
    topic: "Dijkstra's Algorithm",
    skill: "Shortest Path Graph Optimization",
    language: "C++",
    difficulty: "Intermediate",
    durationMinutes: 60,
    timeRemainingSeconds: 3600,
    totalDurationSeconds: 3600,
    expectedOutcome: "Complete conceptual mastery and working C++ implementation of Dijkstra within 60 minutes.",
    status: 'executing',
    current_task: "Understand Shortest-Path Concept & Graph Foundations",
    current_task_id: "task-1",
    tasks: [
      {
        id: 'task-1',
        stepNumber: 1,
        title: 'Understand Shortest-Path Concept & Graph Foundations',
        description: 'Review weighted directed graphs, distance arrays, and the core intuition behind shortest path relaxation.',
        estimatedMinutes: 10,
        status: 'current',
        difficulty: 'beginner',
        type: 'concept'
      },
      {
        id: 'task-2',
        stepNumber: 2,
        title: "Learn Dijkstra's Algorithm Mechanism & Invariants",
        description: 'Study greedy exploration with min-heap priority queue and why negative edge weights cause failures.',
        estimatedMinutes: 15,
        status: 'upcoming',
        difficulty: 'intermediate',
        type: 'resource'
      },
      {
        id: 'task-3',
        stepNumber: 3,
        title: 'Study Time & Space Complexity Tradeoffs',
        description: 'Analyze Adjacency List O((V + E) log V) vs Adjacency Matrix O(V^2) efficiency curves.',
        estimatedMinutes: 8,
        status: 'upcoming',
        difficulty: 'intermediate',
        type: 'concept'
      },
      {
        id: 'task-4',
        stepNumber: 4,
        title: 'Implement in C++ with Standard Library Containers',
        description: 'Write a clean, production-ready C++ implementation using priority_queue and adjacency lists.',
        estimatedMinutes: 15,
        status: 'upcoming',
        difficulty: 'intermediate',
        type: 'code'
      },
      {
        id: 'task-5',
        stepNumber: 5,
        title: 'Solve Practice Problem: Network Delay Time',
        description: 'Simulate packet broadcast across weighted nodes and verify minimum latency calculation.',
        estimatedMinutes: 10,
        status: 'upcoming',
        difficulty: 'intermediate',
        type: 'practice'
      },
      {
        id: 'task-6',
        stepNumber: 6,
        title: 'Complete Agent Learning Mastery Assessment',
        description: 'Interactive quiz evaluating shortest path relaxation, edge relaxation bounds, and complexity.',
        estimatedMinutes: 8,
        status: 'upcoming',
        difficulty: 'intermediate',
        type: 'quiz'
      }
    ],
    completed_tasks: [],
    user_performance: {
      quizzesTaken: 1,
      quizzesPassed: 1,
      accuracyRate: 75,
      consecutiveMistakes: 0,
      masteryScore: 74,
      conceptsMastered: ['Graph Representation', 'Adjacency Lists'],
      weakConcepts: []
    },
    allowed_domains: DEFAULT_ALLOWED_DOMAINS,
    blocked_domains: DEFAULT_BLOCKED_DOMAINS,
    current_resource: {
      id: 'res-dijkstra-1',
      title: "Dijkstra's Algorithm - Single Source Shortest Path with Priority Queue",
      type: 'video',
      duration: 18,
      difficulty: 'intermediate',
      relevance: 0.96,
      url: 'https://www.youtube.com/watch?v=XB4MIexjvY0',
      provider: 'YouTube (Abdul Bari)',
      thumbnail: 'https://img.youtube.com/vi/XB4MIexjvY0/hqdefault.jpg',
      summary: 'Comprehensive breakdown of Dijkstra algorithm using min-heap priority queue, distance relaxation, and O((V+E) log V) complexity analysis.',
      keyConcepts: ['Greedy Choice', 'Priority Queue', 'Distance Relaxation', 'Non-negative Weights']
    },
    current_active_tab: {
      tabTitle: "FocusShield Workspace - Study Session: Learn Dijkstra's Algorithm",
      tabUrl: 'focusshield.internal/workspace',
      goal: "Learn Dijkstra's Algorithm in C++ in 60 minutes",
      isUseful: true,
      verdict: 'USEFUL',
      category: 'Study Workspace',
      usefulnessScore: 100,
      confidence: 0.99,
      reason: 'Active in FocusShield primary study workspace, actively progressing through Dijkstra curriculum.',
      recommendedAction: 'ALLOW_CONTINUE',
      policyEnforced: 'FocusShield Workspace Pass',
      suggestedFocusTip: 'Maintain flow state. Continue to the next algorithm implementation milestone.',
      timestamp: '16:05',
      detectionSource: 'tab_visibility'
    },
    distractions_detected: 7,
    failures: 0,
    recovered_failures: 1,
    next_action: 'START_TASK',
    last_decision: {
      timestamp: '16:05',
      observation: 'Curriculum material loaded: Abdul Bari Dijkstra Algorithm (Relevance: 96%).',
      decision: 'Keep user locked into verified educational context and monitor active tab.',
      action: 'START_TASK',
      reason: 'Multi-Step Execution: Progressing along optimal study path.',
      confidence: 0.94
    },
    agent_traces: [
      {
        id: 'trace-1',
        timestamp: '16:02',
        stepNumber: 1,
        stage: 'OBSERVE',
        title: 'Goal Extracted',
        detail: 'User initiated session: "Learn Dijkstra\'s algorithm in C++ in 60 minutes". Extracted topic: Dijkstra, Language: C++, Time: 60m.',
        action: 'START_TASK'
      },
      {
        id: 'trace-2',
        timestamp: '16:03',
        stepNumber: 2,
        stage: 'DECIDE',
        title: 'Study Plan Generated',
        detail: 'Created 6-step executable study curriculum covering foundations, complexity, C++ coding, and assessment.',
        action: 'SEARCH_RESOURCE'
      },
      {
        id: 'trace-3',
        timestamp: '16:05',
        stepNumber: 3,
        stage: 'ACT',
        title: 'Resource Selected',
        detail: 'Compared 3 resources. Selected Abdul Bari Dijkstra Algorithm (Relevance 0.96, 18m duration).',
        action: 'OPEN_RESOURCE'
      }
    ],
    adaptations: [],
    recovery_state: null,
    active_quiz: {
      id: 'quiz-dijkstra-std',
      question: "Given a directed graph with edge weights: A→B=4, A→C=2, C→B=1, B→D=5, C→D=8. What is the minimum shortest distance from A to D?",
      codeSnippet: "// Graph Edges:\n// A -> B (weight 4)\n// A -> C (weight 2)\n// C -> B (weight 1)\n// B -> D (weight 5)\n// C -> D (weight 8)",
      options: [
        { id: 'opt-1', text: '8 (Path: A → B → D = 4 + 5 = 9, or A → C → D = 10)' },
        { id: 'opt-2', text: '8 (Path: A → C → B → D = 2 + 1 + 5 = 8)' },
        { id: 'opt-3', text: '9 (Path: A → B → D = 4 + 5 = 9)' },
        { id: 'opt-4', text: '10 (Path: A → C → D = 2 + 8 = 10)' }
      ],
      correctOptionId: 'opt-2',
      conceptualExplanation: "The optimal shortest path from A to D visits intermediate node C first: dist(A to C) = 2, then relaxes edge C→B with cost 1 (giving dist(A to B) = 3 instead of 4), and finally relaxes B→D with cost 5. Total cost = 2 + 1 + 5 = 8.",
      difficulty: 'intermediate',
      conceptTested: 'Single-Source Shortest Path Simulation'
    },
    last_quiz_evaluation: null,
    active_explanation: null
  });

  // Hackathon Demo Mode State
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoStepIndex, setDemoStepIndex] = useState(0);

  const DEMO_STEPS = [
    { title: 'Goal Understanding & Extraction', action: 'Extract topic, language, and timeline constraints' },
    { title: 'Curriculum Planning', action: 'Synthesizing multi-step study plan' },
    { title: 'Resource Search & Ranking', action: 'Selecting highest-relevance video tutorial' },
    { title: 'FocusShield Distraction Control', action: 'Intercepting off-topic social tab' },
    { title: 'Diagnostic Assessment', action: 'Presenting shortest-path calculation problem' },
    { title: 'User Performance Evaluation', action: 'Simulating conceptual misconception' },
    { title: 'Dynamic Plan Adaptation', action: 'Re-ordering plan: inserting beginner relaxation tutorial' },
    { title: 'Simulated API Failure & Recovery', action: 'Recovering from video service outage via local mirror' },
    { title: 'Final Assessment & Mastery Check', action: 'Evaluating final 86% comprehension threshold' },
    { title: 'Session Complete (Goal Achieved)', action: 'Displaying hackathon victory summary' }
  ];

  // Helper to log trace
  const addTrace = (
    stage: AgentTraceEntry['stage'],
    title: string,
    detail: string,
    action?: AgentActionType
  ) => {
    const now = new Date();
    const timeStr = now.toTimeString().substring(0, 5);
    const newEntry: AgentTraceEntry = {
      id: `trace-${Date.now()}-${Math.random()}`,
      timestamp: timeStr,
      stepNumber: agentState.agent_traces.length + 1,
      stage,
      title,
      detail,
      action
    };
    setAgentState(prev => ({
      ...prev,
      agent_traces: [newEntry, ...prev.agent_traces]
    }));
  };

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentState(prev => {
        if (prev.timeRemainingSeconds <= 0 || prev.status === 'completed' || prev.status === 'paused') {
          return prev;
        }
        return {
          ...prev,
          timeRemainingSeconds: prev.timeRemainingSeconds - 1
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Demo auto-stepper
  useEffect(() => {
    if (!isDemoRunning) return;

    const timer = setTimeout(() => {
      executeDemoStep(demoStepIndex);
      if (demoStepIndex < DEMO_STEPS.length - 1) {
        setDemoStepIndex(prev => prev + 1);
      } else {
        setIsDemoRunning(false);
        setShowCompletionModal(true);
      }
    }, 3800);

    return () => clearTimeout(timer);
  }, [isDemoRunning, demoStepIndex]);

  // Demo step dispatcher
  const executeDemoStep = (stepIdx: number) => {
    switch (stepIdx) {
      case 0:
        addTrace('OBSERVE', 'Goal Extracted', 'Extracted: "Dijkstra\'s Algorithm", Language: "C++", Duration: 60m.', 'START_TASK');
        break;
      case 1:
        addTrace('DECIDE', 'Curriculum Planned', 'Generated 6 progressive milestones from graph foundations to C++ implementation.', 'SEARCH_RESOURCE');
        break;
      case 2:
        addTrace('ACT', 'Resource Evaluated & Ranked', 'Selected Abdul Bari Dijkstra video (Relevance: 0.96) matching difficulty: intermediate.', 'OPEN_RESOURCE');
        break;
      case 3:
        setAgentState(prev => ({ ...prev, distractions_detected: prev.distractions_detected + 1 }));
        addTrace('OBSERVE', 'Distraction Intercepted', 'User attempted to navigate to "youtube.com/watch?v=gaming". Blocked by FocusShield intent filter.', 'BLOCK_CONTENT');
        break;
      case 4:
        addTrace('ACT', 'Quiz Dispatched', 'Loaded diagnostic question: Shortest path relaxation simulation.', 'GENERATE_QUIZ');
        break;
      case 5:
        // Simulate wrong answer
        handleSimulateWrongAnswer();
        break;
      case 6:
        // Adaptation already triggered by wrong answer
        break;
      case 7:
        // Simulate API failure & recovery
        handleSimulateFailure();
        break;
      case 8:
        // Final assessment passed
        setAgentState(prev => ({
          ...prev,
          user_performance: {
            ...prev.user_performance,
            masteryScore: 86,
            accuracyRate: 85
          }
        }));
        addTrace('EVALUATE', 'Final Assessment Passed', 'Mastery score achieved 86%. Shortest path invariants satisfied.', 'FINISH_SESSION');
        break;
      case 9:
        handleTriggerCompletion();
        break;
    }
  };

  // 1. Initialize Goal
  const handleStartSession = async () => {
    if (!goalInput.trim()) return;
    setIsInitializingGoal(true);
    try {
      const res = await fetch('/api/agent/plan-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput })
      });
      const data = await res.json();
      setAgentState(prev => ({
        ...prev,
        goal: goalInput,
        topic: data.topic,
        skill: data.skill,
        language: data.language,
        difficulty: data.difficulty,
        durationMinutes: data.durationMinutes,
        timeRemainingSeconds: data.durationMinutes * 60,
        totalDurationSeconds: data.durationMinutes * 60,
        expectedOutcome: data.expectedOutcome,
        status: 'executing',
        tasks: data.tasks,
        current_task: data.tasks[0]?.title || 'Foundational Concepts',
        current_task_id: data.tasks[0]?.id || 'task-1',
        completed_tasks: [],
        last_decision: {
          timestamp: new Date().toTimeString().substring(0, 5),
          observation: `Goal parsed: "${data.topic}" in ${data.language}. Plan configured with ${data.tasks.length} tasks.`,
          decision: 'Begin with task 1 and acquire curriculum resources.',
          action: 'SEARCH_RESOURCE',
          reason: 'Goal-driven execution initialized.',
          confidence: 0.98
        }
      }));
      addTrace('OBSERVE', 'Goal Initialized', `Goal: "${goalInput}". Autonomous plan activated.`, 'START_TASK');
    } catch {
      // Fallback local planner already in default state
    } finally {
      setIsInitializingGoal(false);
    }
  };

  // 2. Answer Quiz
  const handleAnswerQuiz = async (questionId: string, optionId: string, correctOptionId: string) => {
    try {
      const res = await fetch('/api/agent/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, selectedOptionId: optionId, correctOptionId })
      });
      const evaluation: QuizAnswerEvaluation = await res.json();
      setAgentState(prev => {
        const isCorrect = evaluation.isCorrect;
        const newScore = Math.min(100, Math.max(0, prev.user_performance.masteryScore + evaluation.scoreDelta));
        const mistakes = isCorrect ? 0 : prev.user_performance.consecutiveMistakes + 1;

        return {
          ...prev,
          last_quiz_evaluation: evaluation,
          user_performance: {
            ...prev.user_performance,
            quizzesTaken: prev.user_performance.quizzesTaken + 1,
            quizzesPassed: isCorrect ? prev.user_performance.quizzesPassed + 1 : prev.user_performance.quizzesPassed,
            consecutiveMistakes: mistakes,
            masteryScore: newScore,
            accuracyRate: Math.round(((prev.user_performance.quizzesPassed + (isCorrect ? 1 : 0)) / (prev.user_performance.quizzesTaken + 1)) * 100)
          }
        };
      });

      if (evaluation.isCorrect) {
        addTrace('EVALUATE', 'Quiz Passed', `Answer correct! Score +15. Mastery at ${agentState.user_performance.masteryScore + 15}%.`, 'START_TASK');
      } else {
        addTrace('OBSERVE', 'Conceptual Misconception', 'User failed relaxation question. Triggering adaptive re-evaluation.', 'DECREASE_DIFFICULTY');
        // Trigger adaptation if multiple mistakes
        if (agentState.user_performance.consecutiveMistakes >= 1) {
          handleTriggerAdaptation();
        }
      }
    } catch {
      // Offline fallback
    }
  };

  // 3. Trigger Adaptation (Requirement 7)
  const handleTriggerAdaptation = () => {
    const adaptationRecord: AgentPlanAdaptationRecord = {
      id: `adapt-${Date.now()}`,
      timestamp: new Date().toTimeString().substring(0, 5),
      triggerReason: 'Low quiz performance & weak relaxation grasp detected.',
      oldTaskTitle: 'Solve Practice Problem: Network Delay Time',
      newTaskTitle: 'Review Relaxation Core Invariant & Solve Beginner Example',
      adjustmentSummary: 'Inserted foundational relaxation tutorial and reduced problem difficulty.',
      adaptationType: 're-explanation'
    };

    // Update state with adapted tasks
    setAgentState(prev => {
      const updatedTasks = prev.tasks.map(t => {
        if (t.id === 'task-5') {
          return {
            ...t,
            title: 'Review Relaxation Core Invariant & Solve Beginner Example',
            description: 'Step back to basic path calculation before attempting advanced LeetCode problems.',
            difficulty: 'beginner' as const,
            isAdapted: true
          };
        }
        return t;
      });

      return {
        ...prev,
        status: 'adapting',
        tasks: updatedTasks,
        adaptations: [adaptationRecord, ...prev.adaptations],
        last_decision: {
          timestamp: new Date().toTimeString().substring(0, 5),
          observation: 'User failed consecutive questions on path cost evaluation.',
          decision: 'Reduce difficulty and explain shortest-path relaxation again.',
          action: 'GENERATE_EXPLANATION',
          reason: 'Adaptation requirement: User demonstrates weak foundation. Re-explain core concept before resuming.',
          confidence: 0.95
        },
        active_explanation: {
          title: 'Shortest-Path Relaxation: The Core Invariant',
          concept: 'Why Relaxation Always Preserves Correctness',
          diagramAscii: `
      [A] ----(4)----> [B] ----(5)----> [D]  (Cost: 4 + 5 = 9)
       |                ^
      (2)              (1)
       |                |
       v                |
      [C] ---------------                    (Better: 2 + 1 + 5 = 8!)
          `,
          keyTakeaways: [
            'In Dijkstra, when a node is popped from the priority queue, its shortest distance is finalized.',
            'Relaxation checks if dist[u] + weight(u, v) < dist[v].',
            'If true, we update dist[v] and push the pair into the priority queue.',
            'Non-negative weights guarantee that visiting new nodes will never decrease distances to already finalized nodes.'
          ],
          exampleSnippet: `// Standard C++ Relaxation Loop\nfor (const auto& edge : adj[u]) {\n    int v = edge.to;\n    int weight = edge.weight;\n    if (dist[u] + weight < dist[v]) {\n        dist[v] = dist[u] + weight;\n        pq.push({dist[v], v});\n    }\n}`
        }
      };
    });

    addTrace('ADAPT', 'Study Plan Adapted', 'Replaced advanced task with beginner relaxation review.', 'GENERATE_EXPLANATION');
  };

  // 4. Simulate Failure & Recovery (Requirement 8 - Robustness)
  const handleSimulateFailure = () => {
    // Stage 1: Failure detected
    const failureState: AgentRecoveryState = {
      isRecovering: true,
      failedToolName: 'Remote Video Streamer API',
      failureReason: 'HTTP 503 Service Unavailable: Remote streaming provider timed out.',
      retryAttempt: 1,
      maxRetries: 2,
      recoveryStrategy: ['Remote Retry (Failed)', 'Alternative Provider Selection', 'Local Verified Mirror Loaded'],
      isResolved: false
    };

    setAgentState(prev => ({
      ...prev,
      status: 'recovering',
      failures: prev.failures + 1,
      recovery_state: failureState,
      last_decision: {
        timestamp: new Date().toTimeString().substring(0, 5),
        observation: 'Resource provider unavailable (HTTP 503 error).',
        decision: 'Execute fallback protocol: Attempt 1 retry, then switch to verified local mirror.',
        action: 'RETRY',
        reason: 'Robustness requirement: Never crash on tool failure. Fallback to local mirror.',
        confidence: 0.99
      }
    }));

    addTrace('RECOVER', 'Tool Failure Detected', 'Remote Video Streamer API failed with 503 error.', 'RETRY');

    // Stage 2: Autonomous Recovery Resolution after 1.8 seconds
    setTimeout(() => {
      setAgentState(prev => ({
        ...prev,
        status: 'executing',
        recovered_failures: prev.recovered_failures + 1,
        recovery_state: {
          ...failureState,
          isResolved: true,
          fallbackResourceLoaded: "[MIRROR] Dijkstra's Algorithm Master Reference & C++ Implementation Code"
        },
        current_resource: {
          id: 'res-dijkstra-fallback',
          title: "[MIRROR] Dijkstra's Algorithm Master Reference & C++ Implementation Code",
          type: 'documentation',
          duration: 12,
          difficulty: 'beginner',
          relevance: 0.94,
          url: 'https://github.com/algorithms/dijkstra-cpp-mirror',
          provider: 'FocusShield Local Knowledge Cache (Verified Mirror)',
          thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=60',
          summary: 'Offline verified mirror containing self-contained C++ source code, graph visualizer notes, and step-by-step trace tables.',
          keyConcepts: ['Local Mirror', 'Offline Trace Table', 'Direct C++ Implementation'],
          isFallback: true
        }
      }));

      addTrace('RECOVER', 'Recovery Successful', 'Backup resource loaded from Local Knowledge Cache. Status: RECOVERED ✓', 'SELECT_RESOURCE');
    }, 1800);
  };

  // 5. Simulate Wrong Answer
  const handleSimulateWrongAnswer = () => {
    handleAnswerQuiz('quiz-dijkstra-std', 'opt-3', 'opt-2');
  };

  // 6. Complete Task and Advance
  const handleAdvanceTask = () => {
    setAgentState(prev => {
      const currentIdx = prev.tasks.findIndex(t => t.id === prev.current_task_id);
      if (currentIdx === -1) return prev;

      const updatedTasks = prev.tasks.map((t, idx) => {
        if (idx === currentIdx) {
          return { ...t, status: 'completed' as const };
        }
        if (idx === currentIdx + 1) {
          return { ...t, status: 'current' as const };
        }
        return t;
      });

      const nextTask = updatedTasks[currentIdx + 1];
      const isAllDone = currentIdx + 1 >= prev.tasks.length;

      if (isAllDone) {
        setShowCompletionModal(true);
      }

      return {
        ...prev,
        tasks: updatedTasks,
        current_task: nextTask?.title || 'Session Complete',
        current_task_id: nextTask?.id || '',
        completed_tasks: [...prev.completed_tasks, prev.current_task_id],
        user_performance: {
          ...prev.user_performance,
          masteryScore: Math.min(100, prev.user_performance.masteryScore + 8)
        },
        status: isAllDone ? 'completed' : 'executing',
        next_action: isAllDone ? 'FINISH_SESSION' : 'START_TASK'
      };
    });

    addTrace('ACT', 'Task Completed', `Completed: "${agentState.current_task}". Advanced to next milestone.`, 'START_TASK');
  };

  // 7. Trigger Final Goal Completion
  const handleTriggerCompletion = () => {
    setAgentState(prev => ({
      ...prev,
      status: 'completed',
      user_performance: {
        ...prev.user_performance,
        masteryScore: 86,
        accuracyRate: 88
      }
    }));
    setShowCompletionModal(true);
    addTrace('EVALUATE', 'Session Completed', 'All requirements satisfied. Goal achieved.', 'FINISH_SESSION');
  };

  // Progress calculations
  const completedTaskCount = agentState.tasks.filter(t => t.status === 'completed').length;
  const goalProgressPercent = Math.round((completedTaskCount / (agentState.tasks.length || 1)) * 100);
  const minutesRemaining = Math.floor(agentState.timeRemainingSeconds / 60);
  const secondsRemaining = agentState.timeRemainingSeconds % 60;

  return (
    <div id="focusshield-agent-root" className="w-full max-w-7xl mx-auto space-y-5 px-3 sm:px-6 py-4">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                FocusShield Agent
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Autonomous AI Study Agent
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Goal-Driven Execution • Dynamic Action Selection • Multi-Step Execution • Adaptation • Robustness
            </p>
          </div>
        </div>

        {/* Quick Goal Presets */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Presets:</span>
          <button
            onClick={() => setGoalInput("Learn Dijkstra's algorithm in C++ in 60 minutes")}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Dijkstra C++ (60m)
          </button>
          <button
            onClick={() => setGoalInput("Master Dynamic Programming Memoization in Python in 45 minutes")}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            DP Memoization (45m)
          </button>
          <button
            onClick={() => setGoalInput("Learn Binary Tree Level Order BFS in 30 minutes")}
            className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            Binary Tree BFS (30m)
          </button>
        </div>
      </div>

      {/* 2. Goal Input Formulation Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          What do you want to accomplish?
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={goalInput}
              onChange={e => setGoalInput(e.target.value)}
              placeholder="e.g. Learn Dijkstra's algorithm in C++ in 60 minutes"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={handleStartSession}
            disabled={isInitializingGoal}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-600/20 shrink-0 flex items-center justify-center space-x-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isInitializingGoal ? 'Planning Curriculum...' : 'Start Session'}</span>
          </button>
        </div>
      </div>

      {/* 2b. Real-Time Active Tab Sentinel Status Indicator */}
      <div
        className={`p-3.5 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-all ${
          agentState.current_active_tab?.isUseful !== false
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/30 ring-1 ring-rose-500/40'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div className="relative shrink-0">
            <span
              className={`w-3 h-3 rounded-full block ${
                agentState.current_active_tab?.isUseful !== false ? 'bg-cyan-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`w-3 h-3 rounded-full absolute inset-0 animate-ping opacity-75 ${
                agentState.current_active_tab?.isUseful !== false ? 'bg-cyan-400' : 'bg-rose-400'
              }`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                Current Active Tab Detected:
              </span>
              <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                {agentState.current_active_tab?.category || 'Active Workspace'}
              </span>
            </div>
            <span className="font-bold text-white truncate block text-sm">
              {agentState.current_active_tab?.tabTitle || "FocusShield Workspace - Study Session: Learn Dijkstra's Algorithm"}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow ${
              agentState.current_active_tab?.isUseful !== false
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
            }`}
          >
            {agentState.current_active_tab?.isUseful !== false ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>ACTIVE TAB IS USEFUL</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>NOT USEFUL (DISTRACTION)</span>
              </>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
            Score: <strong className="text-white">{agentState.current_active_tab?.usefulnessScore ?? 100}/100</strong>
          </span>
        </div>
      </div>

      {/* 3. Progress Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Goal Progress */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Goal Progress</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-white">
            {goalProgressPercent}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Learning Mastery */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Learning Mastery</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
            {agentState.user_performance.masteryScore}%
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            {agentState.user_performance.accuracyRate}% Diagnostic Accuracy
          </span>
        </div>

        {/* Metric 3: Time Remaining */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Time Remaining</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-amber-300">
            {minutesRemaining}m {secondsRemaining.toString().padStart(2, '0')}s
          </div>
          <span className="text-[10px] text-slate-400 block">
            Paced for {agentState.durationMinutes}m target
          </span>
        </div>

        {/* Metric 4: Distractions Blocked */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Distractions Blocked</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-mono font-black text-rose-400">
            {agentState.distractions_detected}
          </div>
          <span className="text-[10px] text-slate-400 block font-mono">
            FocusShield ambient lock active
          </span>
        </div>
      </div>

      {/* 4. Hackathon Demo Mode Interactive Bar */}
      <AgentDemoControls
        isDemoRunning={isDemoRunning}
        currentDemoStepIndex={demoStepIndex}
        totalDemoSteps={DEMO_STEPS.length}
        currentStepDescription={DEMO_STEPS[demoStepIndex]?.action || 'Observing Environment'}
        onToggleDemo={() => setIsDemoRunning(!isDemoRunning)}
        onSimulateFailure={handleSimulateFailure}
        onSimulateWrongAnswer={handleSimulateWrongAnswer}
        onTriggerAdaptation={handleTriggerAdaptation}
        onStepForward={() => {
          if (demoStepIndex < DEMO_STEPS.length - 1) {
            executeDemoStep(demoStepIndex + 1);
            setDemoStepIndex(prev => prev + 1);
          } else {
            setShowCompletionModal(true);
          }
        }}
        onResetSession={() => {
          setDemoStepIndex(0);
          setIsDemoRunning(false);
          handleStartSession();
        }}
        onTriggerCompletion={() => setShowCompletionModal(true)}
      />

      {/* 5. Autonomous Recovery Banner (Active during simulated provider failure) */}
      <AgentRecoveryBanner recoveryState={agentState.recovery_state} />

      {/* 6. Dynamic Decision Engine Panel */}
      <AgentDecisionPanel
        status={agentState.status}
        lastDecision={agentState.last_decision}
        currentTask={agentState.current_task}
        progressPercent={goalProgressPercent}
        nextAction={agentState.next_action}
      />

      {/* 7. Core Interactive Workspace: Left = Study Plan, Right = Active Content/Quiz */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 cols): Adaptive Study Plan */}
        <div className="lg:col-span-5 space-y-4">
          <AgentStudyPlan
            tasks={agentState.tasks}
            currentTaskId={agentState.current_task_id}
            onSelectTask={taskId => {
              const selected = agentState.tasks.find(t => t.id === taskId);
              if (selected) {
                setAgentState(prev => ({
                  ...prev,
                  current_task: selected.title,
                  current_task_id: selected.id
                }));
              }
            }}
            onAdvanceTask={handleAdvanceTask}
          />
        </div>

        {/* Right Column (7 cols): Active Workspace & Assessment */}
        <div className="lg:col-span-7 space-y-4">
          <AgentActiveWorkspace
            currentTask={agentState.tasks.find(t => t.id === agentState.current_task_id) || null}
            resource={agentState.current_resource}
            quiz={agentState.active_quiz}
            quizEvaluation={agentState.last_quiz_evaluation}
            activeExplanation={agentState.active_explanation}
            onAnswerQuiz={handleAnswerQuiz}
            onRequestExplanation={handleTriggerAdaptation}
            onNextQuiz={() => {
              // Load second quiz
              setAgentState(prev => ({
                ...prev,
                last_quiz_evaluation: null,
                active_quiz: {
                  id: 'quiz-dijkstra-complexity',
                  question: 'What is the optimal time complexity of Dijkstra using a Min-Heap (Priority Queue) with Adjacency List?',
                  options: [
                    { id: 'opt-c1', text: 'O(V^2)' },
                    { id: 'opt-c2', text: 'O((V + E) log V)' },
                    { id: 'opt-c3', text: 'O(V * E)' },
                    { id: 'opt-c4', text: 'O(E log E)' }
                  ],
                  correctOptionId: 'opt-c2',
                  conceptualExplanation: 'Each vertex is extracted once from the priority queue (V log V), and each edge is relaxed at most once (E log V). Total: O((V + E) log V).',
                  difficulty: 'intermediate',
                  conceptTested: 'Complexity Analysis'
                }
              }));
            }}
          />
        </div>
      </div>

      {/* 8. Distraction Control Agent Tool (FocusShield Environment Protection) */}
      <AgentDistractionFilterTool
        goal={agentState.goal}
        allowedDomains={agentState.allowed_domains}
        blockedDomains={agentState.blocked_domains}
        distractionsBlockedCount={agentState.distractions_detected}
        onSimulateDistractionAttempt={url => {
          setAgentState(prev => ({
            ...prev,
            distractions_detected: prev.distractions_detected + 1
          }));
          addTrace('OBSERVE', 'Distraction Intercepted', `Blocked unauthorized access to: "${url}".`, 'BLOCK_CONTENT');
        }}
        onActiveTabEvaluated={evaluation => {
          setAgentState(prev => ({
            ...prev,
            current_active_tab: evaluation,
            distractions_detected: !evaluation.isUseful ? prev.distractions_detected + 1 : prev.distractions_detected,
            last_decision: {
              timestamp: new Date().toTimeString().substring(0, 5),
              observation: `Active tab evaluated: "${evaluation.tabTitle}" (${evaluation.isUseful ? 'Goal-Aligned' : 'Off-Task Distraction'}).`,
              decision: evaluation.isUseful
                ? `Allow active tab. Learning usefulness score: ${evaluation.usefulnessScore}/100.`
                : `Intercept distraction tab ("${evaluation.tabTitle}"). Enforce FocusShield return boundary.`,
              action: evaluation.isUseful ? 'ALLOW_CONTENT' : 'BLOCK_CONTENT',
              reason: evaluation.reason,
              confidence: evaluation.confidence
            }
          }));

          if (evaluation.isUseful) {
            addTrace('OBSERVE', 'Active Tab Checked', `Current tab "${evaluation.tabTitle}" is USEFUL (Score: ${evaluation.usefulnessScore}/100).`, 'ALLOW_CONTENT');
          } else {
            addTrace('OBSERVE', 'Distraction Tab Intercepted', `Current tab "${evaluation.tabTitle}" is NOT USEFUL (${evaluation.reason})`, 'BLOCK_CONTENT');
          }
        }}
        onReturnToWorkspace={() => {
          addTrace('ACT', 'Focus Restored', 'Returned to Dijkstra Algorithm study workspace.', 'START_TASK');
        }}
      />

      {/* 9. Expandable Agent Trace Log */}
      <AgentTraceLog
        traces={agentState.agent_traces}
        onClearTraces={() => setAgentState(prev => ({ ...prev, agent_traces: [] }))}
      />

      {/* 10. Victory Modal Screen (Requirement 15) */}
      {showCompletionModal && (
        <AgentGoalCompletedModal
          state={agentState}
          onRestart={() => {
            setShowCompletionModal(false);
            setDemoStepIndex(0);
            handleStartSession();
          }}
          onClose={() => setShowCompletionModal(false)}
        />
      )}
    </div>
  );
};
