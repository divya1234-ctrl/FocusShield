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
