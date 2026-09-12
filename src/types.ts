export type AppCategory = 'social' | 'entertainment' | 'gaming' | 'productivity' | 'education' | 'utility';

export interface AppItem {
  id: string;
  name: string;
  packageName: string;
  iconName: string;
  category: AppCategory;
  isBlocked: boolean;
  dailyLimitMinutes: number;
  usedTodayMinutes: number;
  isHardLocked: boolean;
  color: string;
  lastOpened?: string;
  description: string;
}

export interface FocusIntentRule {
  id: string;
  targetTopic: string;
  userPrompt: string;
  durationMinutes: number;
  remainingSeconds: number;
  totalSeconds: number;
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
  startTime: string;
  endTime?: string;
  allowedKeywords: string[];
  bannedKeywords: string[];
  allowedSubtopics: string[];
  ruleSummary: string;
  motivationalQuote: string;
  strictness: 'STRICT' | 'MODERATE';
  distractionsBlockedCount: number;
  videosWatchedCount: number;
  targetPlatform: 'youtube_only' | 'all_apps';
}

export interface VideoItem {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  channelAvatar: string;
  views: string;
  duration: string;
  uploadDate: string;
  thumbnail: string;
  description: string;
  tags: string[];
  category: 'dsa' | 'coding' | 'ai' | 'web' | 'math' | 'system-design' | 'devops' | 'science' | 'entertainment' | 'gaming' | 'vlog' | 'tech';
  isDsaVideo: boolean; // Topic-match boolean (true = allowed in current study intent)
  subtopic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

export type HistoryEventType =
  | 'app_launch'
  | 'app_blocked'
  | 'video_watched'
  | 'video_blocked'
  | 'focus_started'
  | 'focus_completed'
  | 'phone_pickup'
  | 'search_performed'
  | 'emergency_unblock'
  | 'unauthorized_tab_switch'
  | 'tab_violation_blocked';

export interface MonitoredTabRule {
  id: string;
  domain: string;
  title: string;
  category: 'allowed' | 'disallowed';
  description: string;
  iconName?: string;
  matchPattern: string;
  blockedCount: number;
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  timeString: string;
  type: HistoryEventType;
  title: string;
  details: string;
  category: AppCategory | 'focus_system';
  appName?: string;
  durationMinutes?: number;
  status: 'allowed' | 'intercepted' | 'completed' | 'info';
  penaltyScore?: number;
}

export interface DailyUsageStat {
  date: string;
  dayLabel: string;
  totalScreenTimeMinutes: number;
  focusTimeMinutes: number;
  pickups: number;
  blockedAttempts: number;
  categoryBreakdown: {
    education: number;
    productivity: number;
    social: number;
    entertainment: number;
    gaming: number;
    utility: number;
  };
}

export interface AIProductivityInsight {
  productivityScore: number;
  distractionRisk: 'Low' | 'Medium' | 'High';
  executiveSummary: string;
  keyObservations: string[];
  actionableAdvice: string[];
}

// ==========================================
// FOCUSSHIELD AGENTIC AI STUDY SYSTEM TYPES
// ==========================================

export type AgentActionType =
  | 'SEARCH_RESOURCE'
  | 'SELECT_RESOURCE'
  | 'OPEN_RESOURCE'
  | 'BLOCK_CONTENT'
  | 'ALLOW_CONTENT'
  | 'START_TASK'
  | 'GENERATE_EXPLANATION'
  | 'GENERATE_QUIZ'
  | 'EVALUATE_ANSWER'
  | 'INCREASE_DIFFICULTY'
  | 'DECREASE_DIFFICULTY'
  | 'CHANGE_RESOURCE'
  | 'REPLAN'
  | 'RETRY'
  | 'FINISH_SESSION';

export type AgentExecutionStatus =
  | 'idle'
  | 'planning'
  | 'executing'
  | 'evaluating'
  | 'adapting'
  | 'recovering'
  | 'completed'
  | 'paused';

export interface StudyPlanTask {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  status: 'completed' | 'current' | 'upcoming';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'concept' | 'resource' | 'code' | 'practice' | 'quiz' | 'review';
  adaptedFrom?: string;
  isAdapted?: boolean;
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'video' | 'documentation' | 'interactive' | 'problem';
  duration: number; // in minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  relevance: number; // 0.0 to 1.0 (e.g., 0.95)
  url: string;
  provider: string; // e.g. "YouTube (Abdul Bari)", "GeeksForGeeks", "LeetCode", "MIT OpenCourseWare"
  thumbnail?: string;
  summary: string;
  keyConcepts: string[];
  isFallback?: boolean;
  notes?: string;
}

export interface QuizQuestionOption {
  id: string;
  text: string;
  explanation?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  codeSnippet?: string;
  options: QuizQuestionOption[];
  correctOptionId: string;
  conceptualExplanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  conceptTested: string;
}

export interface QuizAnswerEvaluation {
  isCorrect: boolean;
  selectedOptionId: string;
  correctOptionId: string;
  scoreDelta: number;
  conceptualFeedback: string;
  difficultyAssessment: 'appropriate' | 'too_hard' | 'too_easy';
  recommendedNextAction: AgentActionType;
}

export interface AgentDecisionRecord {
  timestamp: string;
  observation: string;
  decision: string;
  action: AgentActionType;
  reason: string;
  confidence: number;
}

export interface AgentTraceEntry {
  id: string;
  timestamp: string;
  stepNumber: number;
  stage: 'OBSERVE' | 'EVALUATE' | 'DECIDE' | 'ACT' | 'ADAPT' | 'RECOVER';
  title: string;
  detail: string;
  action?: AgentActionType;
  badgeVariant?: 'blue' | 'amber' | 'emerald' | 'rose' | 'purple' | 'slate';
}

export interface AgentRecoveryState {
  isRecovering: boolean;
  failedToolName: string;
  failureReason: string;
  retryAttempt: number;
  maxRetries: number;
  recoveryStrategy: string[];
  isResolved: boolean;
  fallbackResourceLoaded?: string;
}

export interface AgentPlanAdaptationRecord {
  id: string;
  timestamp: string;
  triggerReason: string;
  oldTaskTitle: string;
  newTaskTitle: string;
  adjustmentSummary: string;
  adaptationType: 'simplification' | 're-explanation' | 'escalation';
}

export interface AgentDomainRule {
  domain: string;
  label: string;
  reason: string;
  category: string;
  isAllowed: boolean;
  hitsCount: number;
}

export interface ActiveTabEvaluation {
  tabTitle: string;
  tabUrl?: string;
  goal: string;
  isUseful: boolean;
  verdict: 'USEFUL' | 'NOT_USEFUL';
  category: string;
  usefulnessScore: number;
  confidence: number;
  reason: string;
  recommendedAction: 'ALLOW_CONTINUE' | 'BLOCK_AND_REFOCUS';
  policyEnforced: string;
  suggestedFocusTip: string;
  timestamp: string;
  detectionSource?: 'screen_stream' | 'tab_visibility' | 'browser_tab_switch' | 'manual_activity_check';
}

export interface FocusShieldAgentState {
  goal: string;
  topic: string;
  skill: string;
  language?: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  durationMinutes: number;
  timeRemainingSeconds: number;
  totalDurationSeconds: number;
  expectedOutcome: string;
  status: AgentExecutionStatus;
  current_task: string;
  current_task_id: string;
  tasks: StudyPlanTask[];
  completed_tasks: string[];
  user_performance: {
    quizzesTaken: number;
    quizzesPassed: number;
    accuracyRate: number;
    consecutiveMistakes: number;
    masteryScore: number;
    conceptsMastered: string[];
    weakConcepts: string[];
  };
  allowed_domains: AgentDomainRule[];
  blocked_domains: AgentDomainRule[];
  current_resource: LearningResource | null;
  current_active_tab?: ActiveTabEvaluation | null;
  distractions_detected: number;
  failures: number;
  recovered_failures: number;
  next_action: AgentActionType;
  last_decision: AgentDecisionRecord | null;
  agent_traces: AgentTraceEntry[];
  adaptations: AgentPlanAdaptationRecord[];
  recovery_state: AgentRecoveryState | null;
  active_quiz: QuizQuestion | null;
  last_quiz_evaluation: QuizAnswerEvaluation | null;
  active_explanation: {
    title: string;
    concept: string;
    diagramAscii?: string;
    keyTakeaways: string[];
    exampleSnippet?: string;
  } | null;
}

