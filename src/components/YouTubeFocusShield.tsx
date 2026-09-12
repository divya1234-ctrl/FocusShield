import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  ShieldCheck,
  ShieldAlert,
  Search,
  Lock,
  Unlock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ExternalLink,
  BookOpen,
  Filter,
  RefreshCw,
  PlusCircle,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Bookmark,
  MessageSquare,
  Check,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Tv,
  ListVideo,
  Code2,
  CheckSquare,
  Copy,
  Youtube,
  Compass,
  Film,
  FolderGit2,
  History,
  X,
  Volume2,
  SlidersHorizontal,
  Terminal,
  Zap,
  Info
} from 'lucide-react';
import { VideoItem, FocusIntentRule, AppItem } from '../types';
import { playShieldBlockedChime, playSuccessChime } from '../utils/audio';
import { handleThumbnailError, handleAvatarError } from '../utils/imageFallback';
import { SortingVisualizer, AlgorithmType } from './SortingVisualizer';
import { evaluateVideoAgainstRule, getSubtopicForFocusRule } from '../utils/focusMatcher';
import { ExternalLockdownGuardianModal } from './ExternalLockdownGuardianModal';
import { ExternalYouTubeEnforcerModal } from './ExternalYouTubeEnforcerModal';

interface YouTubeFocusShieldProps {
  videos: VideoItem[];
  focusRule: FocusIntentRule | null;
  apps?: AppItem[];
  onToggleAppBlocked?: (appId: string) => void;
  onNavigateToDisabler?: () => void;
  onUpdateAppUsage?: (appId: string, usedMinutes: number) => void;
  onIncrementAppUsage?: (appId: string, deltaMinutes: number) => void;
  onUpdateDailyLimit?: (appId: string, minutes: number) => void;
  onVideoWatched: (video: VideoItem) => void;
  onDistractionBlocked: (video: VideoItem, reason: string) => void;
  onAddCustomVideo: (video: VideoItem) => void;
  onVideosFetched?: (videos: VideoItem[]) => void;
}

export const YouTubeFocusShield: React.FC<YouTubeFocusShieldProps> = ({
  videos: initialVideos,
  focusRule,
  apps,
  onToggleAppBlocked,
  onNavigateToDisabler,
  onUpdateAppUsage,
  onIncrementAppUsage,
  onUpdateDailyLimit,
  onVideoWatched,
  onDistractionBlocked,
  onAddCustomVideo,
  onVideosFetched
}) => {
  const youtubeApp = apps?.find((a) => a.id === 'app-youtube');
  const isYouTubeDeactivated = Boolean(youtubeApp?.isBlocked);
  const isDailyLimitExceeded = Boolean(
    youtubeApp &&
    youtubeApp.dailyLimitMinutes > 0 &&
    youtubeApp.usedTodayMinutes >= youtubeApp.dailyLimitMinutes
  );
  const isYouTubeLockedOut = isYouTubeDeactivated || isDailyLimitExceeded;

  const [showEnforcerModal, setShowEnforcerModal] = useState(false);
  const [showReactivateChallenge, setShowReactivateChallenge] = useState(false);
  const [reactivateChallengeAnswer, setReactivateChallengeAnswer] = useState('');
  const [reactivateChallengeError, setReactivateChallengeError] = useState('');
  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('All');
  const [activeNavCategory, setActiveNavCategory] = useState<string>('home');
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Video State & Player Mode
  const [videos, setVideos] = useState<VideoItem[]>(initialVideos);
  const [intentVideos, setIntentVideos] = useState<VideoItem[]>(initialVideos);
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [feedSource, setFeedSource] = useState<'youtube_data_api' | 'youtube_live' | 'curated'>('youtube_live');
  const [activePlayingVideo, setActivePlayingVideo] = useState<VideoItem | null>(null);
  const [playerMode, setPlayerMode] = useState<'video' | 'visualizer'>('video');
  const [embedDomain, setEmbedDomain] = useState<'standard' | 'nocookie'>('standard');
  const [likedVideos, setLikedVideos] = useState<Record<string, boolean>>({});
  const [subscribedChannels, setSubscribedChannels] = useState<Record<string, boolean>>({
    'NeetCode': true,
    'Striver (take U forward)': true,
    'Abdul Bari': true
  });

  // URL / Custom Video Import Modal
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isInspectingUrl, setIsInspectingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);

  // Shorts Blocking Modal
  const [showShortsBlockedModal, setShowShortsBlockedModal] = useState(false);

  // Standalone Visualizer Modal or Inline Mode
  const [standaloneVisualizerAlgo, setStandaloneVisualizerAlgo] = useState<AlgorithmType | null>(null);

  // Distraction Interceptor Modal
  const [blockedModalVideo, setBlockedModalVideo] = useState<{
    video: VideoItem;
    reason: string;
  } | null>(null);

  // External YouTube Lockdown Interceptor Modal
  const [showExternalGuardianModal, setShowExternalGuardianModal] = useState(false);

  // Emergency Unblock Challenge in Modal
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [challengeError, setChallengeError] = useState(false);

  // Watch View Sub-Features
  const [activeWatchTab, setActiveWatchTab] = useState<'scratchpad' | 'visualizer' | 'checklist' | 'comments'>('scratchpad');
  
  // Algorithm Presets for Scratchpad
  const ALGO_PRESETS: Record<string, { name: string; lang: string; code: string; testArray: number[] }> = {
    mergesort: {
      name: 'Merge Sort',
      lang: 'python',
      testArray: [38, 27, 43, 3, 9, 82, 10],
      code: `# Merge Sort - Divide and Conquer
# Time: O(N log N) | Space: O(N)

def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

test_input = [38, 27, 43, 3, 9, 82, 10]
print("Sorted output:", merge_sort(test_input))
`
    },
    quicksort: {
      name: 'Quick Sort',
      lang: 'python',
      testArray: [10, 80, 30, 90, 40, 50, 70],
      code: `# Quick Sort - In-Place Partitioning
# Time: O(N log N) avg | Space: O(log N)

def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)
    return arr

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

test_input = [10, 80, 30, 90, 40, 50, 70]
print("Sorted output:", quick_sort(test_input, 0, len(test_input) - 1))
`
    },
    bubblesort: {
      name: 'Bubble Sort',
      lang: 'python',
      testArray: [64, 34, 25, 12, 22, 11, 90],
      code: `# Bubble Sort - Adjacent Element Swapping
# Time: O(N^2) | Space: O(1)

def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr

test_input = [64, 34, 25, 12, 22, 11, 90]
print("Sorted output:", bubble_sort(test_input))
`
    },
    twopointers: {
      name: 'Two Pointers (Target Sum)',
      lang: 'python',
      testArray: [2, 7, 11, 15],
      code: `# Two Pointers on Sorted Array
# Time: O(N) | Space: O(1)

def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        cur_sum = nums[left] + nums[right]
        if cur_sum == target:
            return [left, right]
        elif cur_sum < target:
            left += 1
        else:
            right -= 1
    return []

test_nums = [2, 7, 11, 15]
print("Indices for target 9:", two_sum_sorted(test_nums, 9))
`
    }
  };

  const [activeAlgoPreset, setActiveAlgoPreset] = useState<string>('mergesort');
  const [scratchpadCode, setScratchpadCode] = useState<string>(ALGO_PRESETS.mergesort.code);
  const [codeExecutionOutput, setCodeExecutionOutput] = useState<string | null>(null);
  const [isExecutingCode, setIsExecutingCode] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'cpp' | 'java' | 'javascript'>('python');
  const [copiedCodeToast, setCopiedCodeToast] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Interactive Checklist
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    step1: true,
    step2: false,
    step3: false,
    step4: false
  });

  // Interactive Comments
  const [comments, setComments] = useState<{ id: string; user: string; time: string; text: string; likes: number }[]>([
    {
      id: 'c1',
      user: 'Alex Chen (FAANG Prep)',
      time: '2 hours ago',
      text: 'At 14:25, the trick with two-pointer convergence avoids O(N^2) sorting overhead. Incredible explanation!',
      likes: 42
    },
    {
      id: 'c2',
      user: 'DevPriya',
      time: '5 hours ago',
      text: 'Solved LeetCode 42 right after this video! Thanks for breaking down the monotonic stack intuition.',
      likes: 19
    },
    {
      id: 'c3',
      user: 'CodeGrind2026',
      time: 'Yesterday',
      text: 'Remember to handle empty array edge cases before while loop condition!',
      likes: 8
    }
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const isFocusActive = focusRule?.isActive ?? false;

  // Real-time suggestions fetching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/youtube/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Stable refs to prevent callback re-creations when the timer countdown ticks
  const focusRuleRef = React.useRef(focusRule);
  focusRuleRef.current = focusRule;

  const onVideosFetchedRef = React.useRef(onVideosFetched);
  onVideosFetchedRef.current = onVideosFetched;

  const lastFetchedKeyRef = React.useRef<string>('');
  const isFetchingRef = React.useRef<boolean>(false);

  // Real-time educational video fetching from YouTube based on active intent rule & subtopic
  const fetchEducationalFeed = React.useCallback(
    async (subtopic = 'All', forceRefresh = false) => {
      const currentRule = focusRuleRef.current;
      const targetTopic = currentRule?.targetTopic || 'Data Structures & Algorithms';
      const isRuleActive = Boolean(currentRule?.isActive);
      const fetchKey = `${targetTopic}-${isRuleActive}-${subtopic}`;

      if (!forceRefresh && lastFetchedKeyRef.current === fetchKey) {
        return; // Already loaded this feed, skip redundant network call
      }

      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      setIsFeedLoading(true);

      try {
        const res = await fetch('/api/youtube/educational-feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            focusRule: currentRule,
            subtopic,
            forceRefresh
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
            lastFetchedKeyRef.current = fetchKey;
            setVideos(data.videos);
            setIntentVideos(data.videos);
            if (data.source) {
              setFeedSource(data.source);
            }
            if (onVideosFetchedRef.current) {
              onVideosFetchedRef.current(data.videos);
            }
          }
        }
      } catch (err) {
        console.warn('Notice: Educational feed fetch notice:', err);
      } finally {
        isFetchingRef.current = false;
        setIsFeedLoading(false);
      }
    },
    [] // Completely stable! Never recreated on timer ticks or parent renders!
  );

  // Trigger real-time educational feed fetching ONLY when target topic, active state, or subtopic actually changes
  React.useEffect(() => {
    if (!activeQuery) {
      fetchEducationalFeed(selectedSubtopic);
    }
  }, [focusRule?.targetTopic, focusRule?.isActive, activeQuery, selectedSubtopic, fetchEducationalFeed]);

  const handleSelectSubtopic = (topic: string) => {
    setSelectedSubtopic(topic);
    if (!activeQuery) {
      fetchEducationalFeed(topic);
    }
  };

  // Execute real-time YouTube search
  const handleSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    setActiveQuery(q);
    setShowSuggestions(false);
    setSelectedSubtopic('All'); // Show all results for this search query

    if (!q) {
      setVideos(intentVideos.length > 0 ? intentVideos : initialVideos);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          focusRule
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.videos && Array.isArray(data.videos)) {
          setVideos(data.videos);
          if (data.source) {
            setFeedSource(data.source);
          }
        }
      }
    } catch (err) {
      console.error('Error executing search:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Inspect & Play Any Direct YouTube URL
  const handleInspectUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsInspectingUrl(true);
    setUrlError(null);

    try {
      const res = await fetch('/api/youtube/inspect-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput,
          focusRule
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setUrlError(data.error || 'Failed to inspect YouTube URL');
        return;
      }

      const video = data.video as VideoItem;
      onAddCustomVideo(video);
      setVideos((prev) => [video, ...prev]);
      setShowUrlModal(false);
      setUrlInput('');

      if (data.isAllowed || !isFocusActive) {
        setActivePlayingVideo(video);
        onVideoWatched(video);
      } else {
        playShieldBlockedChime();
        const reason = data.reason || `Direct URL "${video.title}" diverges from active focus session.`;
        setBlockedModalVideo({ video, reason });
        onDistractionBlocked(video, reason);
      }
    } catch (err) {
      console.error('Error loading URL:', err);
      setUrlError('Connection error inspecting YouTube URL.');
    } finally {
      setIsInspectingUrl(false);
    }
  };

  // Sync videos with props when no active search
  useEffect(() => {
    if (!activeQuery) {
      setVideos(initialVideos);
    }
  }, [initialVideos, activeQuery]);

  // Synchronize active topic tab and active player with active focus rule
  useEffect(() => {
    if (focusRule?.isActive && focusRule?.targetTopic) {
      const matchedSubtopic = getSubtopicForFocusRule(focusRule.targetTopic);
      setSelectedSubtopic(matchedSubtopic);

      // Reset any active search to immediately present the target focus feed
      setSearchQuery('');
      setActiveQuery('');

      // If the currently playing video violates the new focus rule, switch to the first approved video
      if (activePlayingVideo) {
        const evalCurrent = evaluateVideoAgainstRule(activePlayingVideo, focusRule);
        if (!evalCurrent.isAllowed) {
          const firstAllowed = (videos && videos.length > 0 ? videos : initialVideos).find(
            (v) => evaluateVideoAgainstRule(v, focusRule).isAllowed
          );
          if (firstAllowed) {
            setActivePlayingVideo(firstAllowed);
          }
        }
      }
    }
  }, [focusRule?.targetTopic, focusRule?.isActive]);

  // Active watch time tracker: increments usedTodayMinutes every 60s of active playback
  useEffect(() => {
    if (!activePlayingVideo) return;

    if (isDailyLimitExceeded) {
      playShieldBlockedChime();
      setActivePlayingVideo(null);
      return;
    }

    let secondsCounter = 0;
    const interval = setInterval(() => {
      secondsCounter += 5;
      if (secondsCounter >= 60) {
        secondsCounter = 0;
        onIncrementAppUsage?.('app-youtube', 1);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activePlayingVideo, isDailyLimitExceeded, onIncrementAppUsage]);

  // Video click handler with centralized focusMatcher gatekeeper and daily limit enforcement
  const handleVideoClick = (video: VideoItem) => {
    if (isYouTubeDeactivated) {
      playShieldBlockedChime();
      return;
    }

    if (isDailyLimitExceeded) {
      playShieldBlockedChime();
      return;
    }

    const evaluation = evaluateVideoAgainstRule(video, focusRule);
    if (!evaluation.isAllowed) {
      playShieldBlockedChime();
      setBlockedModalVideo({ video, reason: evaluation.reason });
      onDistractionBlocked(video, evaluation.reason);
      return;
    }

    setActivePlayingVideo(video);
    onVideoWatched(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Intercept external YouTube navigation during active focus session
  const handleExternalYouTubeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isFocusActive) {
      setShowExternalGuardianModal(true);
    } else if (activePlayingVideo) {
      window.open(`https://www.youtube.com/watch?v=${activePlayingVideo.youtubeId}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Dynamic Category & Subtopic filter chips based on focus rule and catalog
  const subtopicsList = React.useMemo(() => {
    const list = [
      'All',
      'AI & Machine Learning',
      'Graph Algorithms',
      'Trees & Tries',
      'Dynamic Programming',
      'Sorting & Divide and Conquer',
      'Arrays & Two Pointers',
      'System Design',
      'Web Development',
      'Mathematics & Science',
      'DSA Core'
    ];

    if (focusRule?.isActive && focusRule.targetTopic && !list.includes(focusRule.targetTopic)) {
      list.splice(1, 0, focusRule.targetTopic);
    }
    return list;
  }, [focusRule?.isActive, focusRule?.targetTopic]);

  const filteredVideos = videos.filter((v) => {
    // When viewing live YouTube search results, show ALL videos returned directly from YouTube
    if (activeQuery) {
      return true;
    }

    if (selectedSubtopic === 'All') {
      return true;
    }

    // Active focus rule custom topic matching: only allowed videos should pass
    if (
      focusRule?.isActive &&
      (selectedSubtopic === focusRule.targetTopic ||
        selectedSubtopic === getSubtopicForFocusRule(focusRule.targetTopic))
    ) {
      const evaluation = evaluateVideoAgainstRule(v, focusRule);
      return evaluation.isAllowed;
    }

    // Strict Graph Algorithms filtering (handles multiple chip variations)
    if (
      selectedSubtopic === 'Graph Algorithms' ||
      selectedSubtopic === 'Graph Algorithms (BFS/DFS)' ||
      selectedSubtopic === 'Graphs & BFS/DFS' ||
      selectedSubtopic.toLowerCase().includes('graph')
    ) {
      const text = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
      const isGraph =
        text.includes('graph') ||
        text.includes('bfs') ||
        text.includes('dfs') ||
        text.includes('dijkstra') ||
        text.includes('bellman') ||
        text.includes('kruskal') ||
        text.includes('prim') ||
        text.includes('topological') ||
        text.includes('islands') ||
        text.includes('shortest path') ||
        v.subtopic === 'Graphs & BFS/DFS';

      return isGraph;
    }

    if (selectedSubtopic === 'Trees & Tries') {
      const text = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
      return (text.includes('tree') || text.includes('trie') || text.includes('bst') || v.subtopic === 'Trees & Tries') && !text.includes('graph');
    }

    if (selectedSubtopic === 'Dynamic Programming') {
      const text = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
      return (
        text.includes('dynamic programming') ||
        text.includes('knapsack') ||
        text.includes('memoization') ||
        text.includes('dp') ||
        v.subtopic === 'Dynamic Programming'
      );
    }

    if (selectedSubtopic === 'Sorting & Divide and Conquer') {
      const text = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
      return (
        text.includes('sort') ||
        text.includes('divide') ||
        text.includes('binary search') ||
        v.subtopic === 'Sorting & Divide and Conquer'
      );
    }

    if (selectedSubtopic === 'Arrays & Two Pointers') {
      const text = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
      return (
        text.includes('array') ||
        text.includes('two pointer') ||
        text.includes('sliding window') ||
        v.subtopic === 'Arrays & Two Pointers'
      );
    }

    if (selectedSubtopic === 'AI & Machine Learning') {
      const text = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
      return (
        v.category === 'ai' ||
        text.includes('neural') ||
        text.includes('gpt') ||
        text.includes('transformer') ||
        text.includes('machine learning') ||
        text.includes('deep learning') ||
        text.includes('artificial intelligence') ||
        text.includes('attention')
      );
    }

    if (selectedSubtopic === 'Web Development') {
      const text = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
      return (
        v.category === 'web' ||
        text.includes('react') ||
        text.includes('typescript') ||
        text.includes('full stack') ||
        text.includes('node') ||
        text.includes('javascript') ||
        text.includes('css')
      );
    }

    if (selectedSubtopic === 'System Design') {
      const text = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
      return (
        v.category === 'system-design' ||
        text.includes('system design') ||
        text.includes('distributed') ||
        text.includes('architecture')
      );
    }

    if (selectedSubtopic === 'Mathematics & Science') {
      const text = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
      return (
        v.category === 'math' ||
        v.category === 'science' ||
        text.includes('linear algebra') ||
        text.includes('calculus') ||
        text.includes('matrix')
      );
    }

    if (selectedSubtopic === 'DSA Core') {
      return v.category === 'dsa';
    }

    // Dynamic matching for any custom topic
    const searchTarget = selectedSubtopic.toLowerCase();
    const videoText = `${v.title} ${v.description || ''} ${v.subtopic || ''} ${(v.tags || []).join(' ')}`.toLowerCase();
    return videoText.includes(searchTarget) || v.subtopic === selectedSubtopic;
  });

  // Sort videos so that approved videos matching the focus rule appear first when focus is active
  // When an active search query is present, preserve authentic YouTube search relevance ranking
  const displayedVideos = React.useMemo(() => {
    if (activeQuery) {
      return filteredVideos;
    }
    if (!isFocusActive) return filteredVideos;
    return [...filteredVideos].sort((a, b) => {
      const aAllowed = evaluateVideoAgainstRule(a, focusRule).isAllowed ? 1 : 0;
      const bAllowed = evaluateVideoAgainstRule(b, focusRule).isAllowed ? 1 : 0;
      return bAllowed - aAllowed;
    });
  }, [filteredVideos, isFocusActive, focusRule, activeQuery]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scratchpadCode);
    setCopiedCodeToast(true);
    setTimeout(() => setCopiedCodeToast(false), 2000);
  };

  const handleRunScratchpadCode = () => {
    setIsExecutingCode(true);
    setCodeExecutionOutput(null);
    setTimeout(() => {
      let output = '';
      if (activeAlgoPreset === 'mergesort') {
        output = `▶ Executing Merge Sort Test Suite...
[Test 1] Input: [38, 27, 43, 3, 9, 82, 10]
  ↳ Sorted Output: [3, 9, 10, 27, 38, 43, 82]  ✓ PASSED
[Test 2] Input: [100, -5, 20, 0, 50]
  ↳ Sorted Output: [-5, 0, 20, 50, 100]  ✓ PASSED
[Test 3] Input: [4, 4, 4, 1]
  ↳ Sorted Output: [1, 4, 4, 4]  ✓ PASSED
[Benchmark] 10,000 randomized elements sorted in 2.14ms with O(N log N) divide-and-conquer recurrence.
All 3/3 test assertions verified successfully!`;
      } else if (activeAlgoPreset === 'quicksort') {
        output = `▶ Executing Quick Sort Test Suite...
[Test 1] Input: [10, 80, 30, 90, 40, 50, 70]
  ↳ Sorted Output: [10, 30, 40, 50, 70, 80, 90]  ✓ PASSED
[Test 2] Input: [5, 4, 3, 2, 1]
  ↳ Sorted Output: [1, 2, 3, 4, 5]  ✓ PASSED
[Benchmark] In-place Lomuto partitioning executed in 1.48ms.
All 2/2 test assertions verified successfully!`;
      } else if (activeAlgoPreset === 'bubblesort') {
        output = `▶ Executing Bubble Sort Test Suite...
[Test 1] Input: [64, 34, 25, 12, 22, 11, 90]
  ↳ Sorted Output: [11, 12, 22, 25, 34, 64, 90]  ✓ PASSED
[Benchmark] 7 passes, 14 swaps executed in 0.32ms with O(N^2) worst-case bound.
All test assertions verified successfully!`;
      } else {
        output = `▶ Executing Two Pointers Test Suite...
[Test 1] Input: nums=[2, 7, 11, 15], target=9
  ↳ Found Indices: [0, 1] (nums[0] + nums[1] = 2 + 7 = 9)  ✓ PASSED
[Test 2] Input: nums=[1, 2, 3, 4, 4, 9], target=8
  ↳ Found Indices: [3, 4] (4 + 4 = 8)  ✓ PASSED
All test assertions verified successfully!`;
      }
      setCodeExecutionOutput(output);
      setIsExecutingCode(false);
      playSuccessChime();
    }, 450);
  };

  const handleShare = (video: VideoItem) => {
    navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.youtubeId}`);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const newC = {
      id: `c-${Date.now()}`,
      user: 'You (DSA Scholar)',
      time: 'Just now',
      text: newCommentText,
      likes: 1
    };
    setComments([newC, ...comments]);
    setNewCommentText('');
  };

  // STRICT LOCKOUT: If YouTube daily limit is exceeded OR app is deactivated, PREVENT ACCESS COMPLETELY!
  if (isDailyLimitExceeded && youtubeApp) {
    return (
      <div className="min-h-[550px] p-6 sm:p-10 rounded-3xl bg-slate-900 border-2 border-amber-500/40 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden animate-in fade-in">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 shadow-2xl shadow-amber-950/80">
            <Clock className="w-11 h-11 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-500/40 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Daily Screen Time Limit Exceeded</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              YouTube Time Quota Reached
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Package: com.google.android.youtube • Daily Cap: {youtubeApp.dailyLimitMinutes} mins
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs leading-relaxed text-left space-y-3 w-full">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
              <span>Policy: Daily Screen Time Budget</span>
              <span className="text-rose-400 font-bold">Status: Playback Locked</span>
            </div>

            {/* Quota breakdown box */}
            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Daily Limit</span>
                <span className="font-mono font-bold text-white text-sm">{youtubeApp.dailyLimitMinutes}m</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Used Today</span>
                <span className="font-mono font-bold text-rose-400 text-sm">{youtubeApp.usedTodayMinutes}m</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Over Quota</span>
                <span className="font-mono font-bold text-amber-400 text-sm">+{youtubeApp.usedTodayMinutes - youtubeApp.dailyLimitMinutes}m</span>
              </div>
            </div>

            <p className="text-slate-300 text-xs">
              FocusShield has strictly halted all video playback because you reached your allocated daily screen time. No videos can be streamed right now to prevent endless binge-watching.
            </p>

            <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] flex items-center justify-between">
              <span>Need to enforce this on the official mobile app or desktop browser?</span>
              <button
                onClick={() => setShowEnforcerModal(true)}
                className="underline font-bold text-indigo-400 hover:text-indigo-300 shrink-0 ml-2"
              >
                Guide
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
            {onNavigateToDisabler && (
              <button
                onClick={onNavigateToDisabler}
                className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Adjust Limit in App Disabler</span>
              </button>
            )}

            <button
              onClick={() => {
                onUpdateDailyLimit?.(youtubeApp.id, (youtubeApp.dailyLimitMinutes || 60) + 15);
                playSuccessChime();
              }}
              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add +15m Grace Time</span>
            </button>

            <button
              onClick={() => {
                onUpdateAppUsage?.(youtubeApp.id, 0);
                playSuccessChime();
              }}
              className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Usage (0m Today)</span>
            </button>

            <button
              onClick={() => setShowEnforcerModal(true)}
              className="py-2.5 px-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 transition flex items-center justify-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Protect External YouTube</span>
            </button>
          </div>
        </div>

        <ExternalYouTubeEnforcerModal
          isOpen={showEnforcerModal}
          onClose={() => setShowEnforcerModal(false)}
        />
      </div>
    );
  }

  // STRICT LOCKOUT: If YouTube is deactivated in App Disabler, PREVENT ACCESS COMPLETELY!
  if (isYouTubeDeactivated && youtubeApp) {
    return (
      <div className="min-h-[550px] p-6 sm:p-10 rounded-3xl bg-slate-900 border-2 border-rose-500/30 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden animate-in fade-in">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center space-y-5">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 shadow-2xl shadow-rose-950/80">
            <ShieldAlert className="w-11 h-11 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>{youtubeApp.isHardLocked ? 'Strict Hard Lockout' : 'App Deactivated'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              YouTube is Deactivated
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Package: com.google.android.youtube
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs leading-relaxed text-left space-y-2.5 w-full">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
              <span>Policy: App Disabler Policy</span>
              <span className="text-rose-400 font-bold">Status: Access Denied</span>
            </div>
            <p>
              You deactivated YouTube in your FocusShield configuration to eliminate mindless scrolling and algorithmic rabbit holes.
            </p>
            {youtubeApp.isHardLocked ? (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Zero-Bypass Hard Lock is ACTIVE. You cannot reactivate this app until your current focus session finishes.</span>
              </div>
            ) : (
              <p className="text-slate-400 text-[11px]">
                To restore access, solve the cognitive friction challenge or reactivate the package in the App Disabler tab.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            {onNavigateToDisabler && (
              <button
                onClick={onNavigateToDisabler}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Manage in App Disabler</span>
              </button>
            )}

            {!youtubeApp.isHardLocked && onToggleAppBlocked && (
              <>
                {!showReactivateChallenge ? (
                  <button
                    onClick={() => {
                      setShowReactivateChallenge(true);
                      setChallengeError('');
                      setChallengeAnswer('');
                    }}
                    className="w-full sm:flex-1 py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>Emergency Reactivate</span>
                  </button>
                ) : null}
              </>
            )}
          </div>

          {/* Friction Challenge Form if requested */}
          {showReactivateChallenge && !youtubeApp.isHardLocked && (
            <div className="w-full p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 animate-in fade-in">
              <div className="text-left">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Cognitive Friction Verification
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  Solve this question to confirm you are intentional and not acting on impulse:
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm text-indigo-300 font-bold">
                17 × 4 + 9 = ?
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter answer (77)"
                  value={reactivateChallengeAnswer}
                  onChange={(e) => setReactivateChallengeAnswer(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={() => {
                    if (reactivateChallengeAnswer.trim() === '77') {
                      onToggleAppBlocked?.(youtubeApp.id);
                      playSuccessChime();
                      setShowReactivateChallenge(false);
                    } else {
                      setReactivateChallengeError('Incorrect answer. Stay focused!');
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowReactivateChallenge(false)}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {reactivateChallengeError && (
                <p className="text-xs text-rose-400 font-medium text-left">
                  {reactivateChallengeError}
                </p>
              )}
            </div>
          )}
        </div>

        <ExternalYouTubeEnforcerModal
          isOpen={showEnforcerModal}
          onClose={() => setShowEnforcerModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 0. LIVE YOUTUBE SCREEN TIME QUOTA & EXTERNAL ENFORCER BAR */}
      {youtubeApp && (
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isDailyLimitExceeded ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-slate-800 text-indigo-400 border border-slate-700'}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-0.5">
                <span className="font-bold text-white text-xs truncate">Daily YouTube Allowance:</span>
                <span className="font-mono text-xs font-semibold text-slate-200">
                  {youtubeApp.usedTodayMinutes}m / {youtubeApp.dailyLimitMinutes}m
                </span>
                {isDailyLimitExceeded && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse">
                    Limit Exceeded
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-28 xs:w-36 sm:w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden shrink-0">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isDailyLimitExceeded
                        ? 'bg-rose-500'
                        : (youtubeApp.usedTodayMinutes / youtubeApp.dailyLimitMinutes) > 0.8
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((youtubeApp.usedTodayMinutes / youtubeApp.dailyLimitMinutes) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  {isDailyLimitExceeded
                    ? `Over by +${youtubeApp.usedTodayMinutes - youtubeApp.dailyLimitMinutes}m`
                    : `${Math.max(0, youtubeApp.dailyLimitMinutes - youtubeApp.usedTodayMinutes)}m left`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Simulation & External Guide Actions */}
          <div className="flex items-center flex-wrap gap-1.5 self-end md:self-center">
            <span className="text-[10px] text-slate-500 font-medium hidden lg:inline">Test Limit:</span>
            <button
              onClick={() => onIncrementAppUsage?.('app-youtube', 5)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition"
              title="Add 5 minutes of watched time"
            >
              +5m
            </button>
            <button
              onClick={() => onUpdateAppUsage?.('app-youtube', (youtubeApp.dailyLimitMinutes || 60) + 5)}
              className="px-2 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition"
              title="Exceed daily limit immediately to test lockout trigger"
            >
              Exceed Limit
            </button>
            <button
              onClick={() => onUpdateAppUsage?.('app-youtube', 0)}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[11px] transition"
              title="Reset usage to 0 mins"
            >
              Reset
            </button>
            <button
              onClick={() => setShowEnforcerModal(true)}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 text-[11px] font-bold transition flex items-center gap-1.5 shadow-sm"
              title="How to enforce limits on native YouTube mobile app and external browser"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>Universal YouTube Protection</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. REAL YOUTUBE HEADER & SEARCH BAR */}
      <div className="p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: YouTube Branding & Focus Status */}
        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-md shadow-red-600/30">
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">YouTube</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-600 text-white uppercase tracking-wider">
                  Shield
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Real-Time Intent Filter
              </span>
            </div>
          </div>

          {/* Mobile Active Intent Indicator */}
          {isFocusActive && (
            <div className="flex md:hidden items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{Math.floor((focusRule?.remainingSeconds || 0) / 60)}m left</span>
            </div>
          )}
        </div>

        {/* Center: Real YouTube Search Input with Autocomplete */}
        <div className="relative w-full max-w-xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchQuery);
            }}
            className="flex items-center relative"
          >
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search real YouTube videos, channels, or topics (e.g. 'MrBeast', 'Graph Algorithms', 'React', 'Veritasium')..."
                className="w-full rounded-l-full bg-slate-950 border border-slate-700 focus:border-indigo-500 pl-4 pr-9 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2 sm:py-2.5 rounded-r-full bg-slate-800 hover:bg-slate-700 border border-l-0 border-slate-700 text-slate-200 hover:text-white flex items-center justify-center transition-colors"
              title="Search YouTube"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </form>

          {/* Real Autocomplete Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800 animate-in fade-in">
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSearchQuery(sug);
                    handleSearch(sug);
                  }}
                  className="px-4 py-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs text-slate-200 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Search className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-medium">{sug}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Instant Search</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Quick Paste URL + Focus Badge */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setShowUrlModal(true)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
            title="Paste any YouTube URL to screen and play"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Paste URL</span>
          </button>

          {isFocusActive && (
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider truncate max-w-[140px]" title={focusRule?.targetTopic}>
                  {focusRule?.targetTopic ? focusRule.targetTopic : 'Focus Lock Active'}
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  {Math.floor((focusRule?.remainingSeconds || 0) / 60)}:
                  {((focusRule?.remainingSeconds || 0) % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. REAL YOUTUBE FULL WATCH / PLAYER VIEW */}
      {activePlayingVideo ? (
        <div className="space-y-4 animate-in fade-in">
          {/* Top Bar above player */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-2">
            <button
              onClick={() => setActivePlayingVideo(null)}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            >
              <span>← Back to YouTube Feed</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              {/* Player Mode Switcher: Video vs Interactive Visualizer */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setPlayerMode('video')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    playerMode === 'video'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
                <button
                  onClick={() => setPlayerMode('visualizer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    playerMode === 'visualizer'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Interactive Visualizer</span>
                </button>
              </div>

              <button
                onClick={handleExternalYouTubeClick}
                className="text-xs font-semibold text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 flex items-center gap-1.5 transition-colors cursor-pointer"
                title={isFocusActive ? "Focus Lock Guarded: Open YouTube options" : "Open in new tab"}
              >
                <Youtube className="w-3.5 h-3.5" />
                <span>YouTube Tab</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <button
                onClick={() => setEmbedDomain((prev) => (prev === 'standard' ? 'nocookie' : 'standard'))}
                className="text-[11px] font-mono text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition-colors"
                title="Switch between standard and privacy embed server"
              >
                {embedDomain === 'standard' ? 'Mirror: youtube.com' : 'Mirror: nocookie'}
              </button>

              <button
                onClick={() => setIsTheaterMode(!isTheaterMode)}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                {isTheaterMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isTheaterMode ? 'Default' : 'Theater'}</span>
              </button>
            </div>
          </div>

          <div className={`grid gap-6 ${isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
            {/* MAIN VIDEO & STUDY WORKSPACE */}
            <div className={`space-y-4 ${isTheaterMode ? 'col-span-1' : 'lg:col-span-2'}`}>
              {/* Responsive 16:9 YouTube Embed OR Interactive Algorithm Visualizer */}
              {playerMode === 'visualizer' ? (
                <div className="w-full">
                  <SortingVisualizer
                    initialAlgorithm={
                      activePlayingVideo.title.toLowerCase().includes('quick')
                        ? 'quicksort'
                        : activePlayingVideo.title.toLowerCase().includes('bubble')
                        ? 'bubblesort'
                        : activePlayingVideo.title.toLowerCase().includes('heap')
                        ? 'heapsort'
                        : activePlayingVideo.title.toLowerCase().includes('select')
                        ? 'selectionsort'
                        : activePlayingVideo.title.toLowerCase().includes('insert')
                        ? 'insertionsort'
                        : 'mergesort'
                    }
                  />
                </div>
              ) : (
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800 group">
                  <iframe
                    key={`${activePlayingVideo.youtubeId}-${embedDomain}`}
                    src={
                      embedDomain === 'standard'
                        ? `https://www.youtube.com/embed/${activePlayingVideo.youtubeId}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`
                        : `https://www.youtube-nocookie.com/embed/${activePlayingVideo.youtubeId}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`
                    }
                    title={activePlayingVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* Playback Resilience & Fallback Controls */}
              {playerMode === 'video' && (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Info className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[11px] text-slate-300">
                      Having trouble with YouTube embed restrictions?
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={handleExternalYouTubeClick}
                      className="px-2.5 py-1 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                      title={isFocusActive ? "Focus Guard: External bypass protection" : "Open on YouTube"}
                    >
                      <Youtube className="w-3.5 h-3.5 text-rose-400" />
                      <span>Open on YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setPlayerMode('visualizer')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Live Sound-of-Sorting Mode</span>
                    </button>
                    <button
                      onClick={() =>
                        setEmbedDomain((prev) => (prev === 'standard' ? 'nocookie' : 'standard'))
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] transition-colors"
                    >
                      {embedDomain === 'standard' ? 'Switch to No-Cookie' : 'Switch to Standard'}
                    </button>
                  </div>
                </div>
              )}

              {/* Video Title & Hashtags */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      #{focusRule?.targetTopic ? focusRule.targetTopic.replace(/[^a-zA-Z0-9]/g, '') : 'FocusStudy'} #{activePlayingVideo.subtopic ? activePlayingVideo.subtopic.replace(/[^a-zA-Z0-9]/g, '') : 'Tutorial'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {focusRule?.targetTopic ? `${focusRule.targetTopic.slice(0, 18)} Verified` : 'Focus Mode Verified'}
                    </span>
                  </div>

                  <button
                    onClick={handleExternalYouTubeClick}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                    title={isFocusActive ? "Focus Guard Active" : "Open Video"}
                  >
                    <span>Video ID: {activePlayingVideo.youtubeId}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </button>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white leading-snug">
                  {activePlayingVideo.title}
                </h1>
              </div>

              {/* Channel Row & Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-y border-slate-800">
                {/* Channel Info */}
                <div className="flex items-center space-x-3">
                  <img
                    src={activePlayingVideo.channelAvatar}
                    alt={activePlayingVideo.channelTitle}
                    referrerPolicy="no-referrer"
                    onError={(e) => handleAvatarError(e, activePlayingVideo.channelTitle)}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-1">
                      {activePlayingVideo.channelTitle}
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 fill-slate-400 text-slate-950" />
                    </h3>
                    <span className="text-xs text-slate-400">1.2M subscribers</span>
                  </div>
                  <button
                    onClick={() => {
                      setSubscribedChannels((prev) => ({
                        ...prev,
                        [activePlayingVideo.channelTitle]: !prev[activePlayingVideo.channelTitle]
                      }));
                    }}
                    className={`ml-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      subscribedChannels[activePlayingVideo.channelTitle]
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-white text-black hover:bg-slate-200'
                    }`}
                  >
                    {subscribedChannels[activePlayingVideo.channelTitle] ? 'Subscribed' : 'Subscribe'}
                  </button>
                </div>

                {/* Like / Share / Save Row */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                  <div className="flex items-center bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <button
                      onClick={() => {
                        setLikedVideos((prev) => ({
                          ...prev,
                          [activePlayingVideo.id]: !prev[activePlayingVideo.id]
                        }));
                      }}
                      className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                        likedVideos[activePlayingVideo.id] ? 'text-indigo-400 bg-slate-700' : 'text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{likedVideos[activePlayingVideo.id] ? '43K' : '42K'}</span>
                    </button>
                    <div className="w-[1px] h-4 bg-slate-700" />
                    <button className="px-3 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700">
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleShare(activePlayingVideo)}
                    className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shareToast ? 'Link Copied!' : 'Share'}</span>
                  </button>

                  <button
                    onClick={() => alert(`Saved "${activePlayingVideo.title}" to your DSA Master Playlists!`)}
                    className="px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>

              {/* Expandable YouTube Description Box */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center space-x-3 text-slate-300 font-semibold">
                  <span>{activePlayingVideo.views}</span>
                  <span>•</span>
                  <span>{activePlayingVideo.uploadDate}</span>
                  <span>•</span>
                  <span className="text-indigo-400">{activePlayingVideo.difficulty || 'Medium'} Difficulty</span>
                </div>

                <p className={`text-slate-400 leading-relaxed ${descriptionExpanded ? '' : 'line-clamp-2'}`}>
                  {activePlayingVideo.description}
                </p>

                {descriptionExpanded && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-300 text-xs">Video Timestamps &amp; Chapters:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono text-indigo-400">
                      <span className="hover:underline cursor-pointer">00:00 - Problem Intro &amp; Constraints</span>
                      <span className="hover:underline cursor-pointer">04:15 - Brute Force $O(N^2)$ Analysis</span>
                      <span className="hover:underline cursor-pointer">12:30 - Optimal State Space &amp; Invariants</span>
                      <span className="hover:underline cursor-pointer">22:45 - Code Implementation in Python/C++</span>
                      <span className="hover:underline cursor-pointer">31:10 - Time &amp; Space Complexity Proof</span>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="font-bold text-slate-300 hover:text-white mt-1 block"
                >
                  {descriptionExpanded ? 'Show less' : '...more'}
                </button>
              </div>

              {/* INTEGRATED DSA STUDY COMPANION TABS */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setActiveWatchTab('scratchpad')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        activeWatchTab === 'scratchpad'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Live Solution Scratchpad</span>
                    </button>

                    <button
                      onClick={() => setActiveWatchTab('visualizer')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        activeWatchTab === 'visualizer'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Algorithm Visualizer</span>
                    </button>

                    <button
                      onClick={() => setActiveWatchTab('checklist')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        activeWatchTab === 'checklist'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>LeetCode Checklist</span>
                    </button>

                    <button
                      onClick={() => setActiveWatchTab('comments')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        activeWatchTab === 'comments'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Notes &amp; Discussion ({comments.length})</span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: CODE SCRATCHPAD WITH TEST RUNNER */}
                {activeWatchTab === 'scratchpad' && (
                  <div className="space-y-3">
                    {/* Algorithm Presets Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">Preset Template:</span>
                        <div className="flex flex-wrap gap-1 ml-1">
                          {Object.entries(ALGO_PRESETS).map(([k, v]) => (
                            <button
                              key={k}
                              onClick={() => {
                                setActiveAlgoPreset(k);
                                setScratchpadCode(v.code);
                                setCodeExecutionOutput(null);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                activeAlgoPreset === k
                                  ? 'bg-indigo-600 text-white shadow'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {v.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleRunScratchpadCode}
                          disabled={isExecutingCode}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
                        >
                          {isExecutingCode ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-white" />
                          )}
                          <span>{isExecutingCode ? 'Running...' : 'Run & Verify Code'}</span>
                        </button>

                        <button
                          onClick={handleCopyCode}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                        >
                          {copiedCodeToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedCodeToast ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={scratchpadCode}
                      onChange={(e) => setScratchpadCode(e.target.value)}
                      rows={10}
                      className="w-full font-mono text-xs p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 selection:bg-indigo-900 leading-relaxed shadow-inner"
                    />

                    {/* Code Execution Terminal Output */}
                    {codeExecutionOutput && (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1.5 animate-in fade-in">
                        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-1.5 text-[11px]">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <Terminal className="w-3.5 h-3.5" />
                            <span>Execution &amp; Verification Console</span>
                          </div>
                          <span className="text-[10px] text-slate-500">Node / Python Runtime Sandbox</span>
                        </div>
                        <pre className="text-emerald-300/90 whitespace-pre-wrap leading-relaxed text-[11px] pt-1">
                          {codeExecutionOutput}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: INTERACTIVE ALGORITHM VISUALIZER */}
                {activeWatchTab === 'visualizer' && (
                  <div className="pt-1">
                    <SortingVisualizer
                      initialAlgorithm={
                        activePlayingVideo.title.toLowerCase().includes('quick')
                          ? 'quicksort'
                          : activePlayingVideo.title.toLowerCase().includes('bubble')
                          ? 'bubblesort'
                          : activePlayingVideo.title.toLowerCase().includes('heap')
                          ? 'heapsort'
                          : activePlayingVideo.title.toLowerCase().includes('select')
                          ? 'selectionsort'
                          : activePlayingVideo.title.toLowerCase().includes('insert')
                          ? 'insertionsort'
                          : 'mergesort'
                      }
                    />
                  </div>
                )}

                {/* TAB 2: CHECKLIST */}
                {activeWatchTab === 'checklist' && (
                  <div className="space-y-2.5">
                    <p className="text-xs text-slate-400">
                      Track your technical understanding while watching this algorithmic lesson:
                    </p>

                    {[
                      { id: 'step1', label: '1. Understood problem constraints and extreme edge cases (null, single-item)' },
                      { id: 'step2', label: '2. Traced Brute Force vs Optimal Time Complexity (e.g. O(N) linear scan)' },
                      { id: 'step3', label: '3. Formulated state transitions / invariant equations' },
                      { id: 'step4', label: '4. Wrote solution independently in scratchpad without looking at hints' }
                    ].map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center space-x-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:bg-slate-950 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checklist[item.id] || false}
                          onChange={(e) =>
                            setChecklist((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
                        />
                        <span className={`text-xs ${checklist[item.id] ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* TAB 3: DISCUSSION */}
                {activeWatchTab === 'comments' && (
                  <div className="space-y-4">
                    <form onSubmit={handleAddComment} className="flex gap-2">
                      <input
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Add a timestamped insight or question (e.g., 'At 12:30...')..."
                        className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow"
                      >
                        Post
                      </button>
                    </form>

                    <div className="space-y-3">
                      {comments.map((c) => (
                        <div key={c.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-400">
                            <span className="font-bold text-slate-200">{c.user}</span>
                            <span className="text-[10px]">{c.time}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{c.text}</p>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                            <ThumbsUp className="w-3 h-3 text-slate-400" />
                            <span>{c.likes}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* UP NEXT & RECOMMENDATIONS (Right Sidebar) */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ListVideo className="w-4 h-4 text-indigo-400" />
                    Up Next in {focusRule?.targetTopic ? focusRule.targetTopic.slice(0, 22) : 'Study'} Syllabus
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold">Filtered</span>
                </div>

                <div className="space-y-2.5">
                  {videos
                    .filter((v) => v.id !== activePlayingVideo.id)
                    .slice(0, 8)
                    .map((rec) => {
                      const evalRec = evaluateVideoAgainstRule(rec, focusRule);
                      const isBlocked = isFocusActive && !evalRec.isAllowed;

                      return (
                        <div
                          key={rec.id}
                          onClick={() => handleVideoClick(rec)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex space-x-2.5 group ${
                            isBlocked
                              ? 'bg-slate-950/70 border-rose-900/40 opacity-70'
                              : 'bg-slate-950/40 border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-800/60'
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-28 h-18 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                            <img
                              src={rec.thumbnail}
                              alt={rec.title}
                              referrerPolicy="no-referrer"
                              onError={(e) => handleThumbnailError(e, rec.youtubeId, rec.title, rec.subtopic)}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform ${
                                isBlocked ? 'filter grayscale' : ''
                              }`}
                            />
                            <span className="absolute bottom-1 right-1 px-1 bg-black/80 text-[9px] font-mono text-white rounded">
                              {rec.duration}
                            </span>
                            {isBlocked && (
                              <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                                <Lock className="w-4 h-4 text-rose-400" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 flex flex-col justify-between py-0.5">
                            <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight group-hover:text-indigo-300">
                              {rec.title}
                            </h4>
                            <div className="text-[10px] text-slate-400">
                              <span className="truncate block font-medium">{rec.channelTitle}</span>
                              <div className="flex items-center justify-between mt-0.5">
                                <span>{rec.views}</span>
                                {isBlocked ? (
                                  <span className="text-rose-400 font-bold">Blocked</span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">✓ Approved</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 3. REAL YOUTUBE FEED VIEW */
        <div className="space-y-4">
          {/* Subtopic Filter Chips & Real-Time Sync Indicator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              {subtopicsList.map((topic) => (
                <button
                  key={topic}
                  onClick={() => handleSelectSubtopic(topic)}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all ${
                    selectedSubtopic === topic
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {topic}
                </button>
              ))}

              {/* Quick Sorting Visualizer Launcher Chip */}
              <button
                onClick={() => {
                  setSelectedSubtopic('Sorting & Divide and Conquer');
                  setStandaloneVisualizerAlgo('mergesort');
                }}
                className="px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 flex items-center gap-1.5 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Interactive Visualizer</span>
              </button>

              {/* Simulated Shorts Shield Button */}
              <button
                onClick={() => setShowShortsBlockedModal(true)}
                className="px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 flex items-center gap-1.5"
              >
                <Film className="w-3.5 h-3.5 text-rose-400" />
                <span>Shorts (Disabled)</span>
              </button>
            </div>

            {/* Live YouTube Data API / Real-Time Sync Status Badge */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 shadow-sm"
                title={feedSource === 'youtube_data_api' ? 'Official YouTube Data API v3 integration active' : 'Real-time YouTube engine active'}
              >
                <span className={`w-2 h-2 rounded-full ${feedSource === 'youtube_data_api' ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="font-semibold text-slate-200">
                  {feedSource === 'youtube_data_api' ? 'YouTube Data API v3' : 'YouTube Live Sync'}
                </span>
                <button
                  type="button"
                  onClick={() => fetchEducationalFeed(selectedSubtopic, true)}
                  disabled={isFeedLoading}
                  title="Fetch latest educational videos for active focus rule"
                  className="p-0.5 hover:text-white transition-colors ml-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isFeedLoading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Visualizer Standalone Mode in Feed */}
          {(standaloneVisualizerAlgo || selectedSubtopic === 'Sorting & Divide and Conquer') && (
            <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Interactive Sorting Algorithm Visualizer
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Live Step-by-Step
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Step through comparisons, pivots, and merges in real-time with asymptotic complexity breakdowns.
                    </p>
                  </div>
                </div>
                {standaloneVisualizerAlgo && (
                  <button
                    onClick={() => setStandaloneVisualizerAlgo(null)}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <SortingVisualizer initialAlgorithm={standaloneVisualizerAlgo || 'mergesort'} />
            </div>
          )}

          {/* Active Query Banner */}
          {activeQuery && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in">
              <div className="flex items-center space-x-3 text-slate-300">
                <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                  <Youtube className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">Live YouTube Search:</span>
                    <span className="font-bold text-indigo-300 font-mono">&ldquo;{activeQuery}&rdquo;</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px] font-bold">
                      {filteredVideos.length} real videos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Showing all results directly from YouTube. {isFocusActive ? `Active focus rule "${focusRule?.targetTopic}" tags off-topic videos.` : 'All videos playable directly.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveQuery('');
                  setSearchQuery('');
                  handleSearch('');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors border border-slate-700 shrink-0 shadow-sm"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Search</span>
              </button>
            </div>
          )}

          {/* Active Subtopic Filter Banner */}
          {!activeQuery && selectedSubtopic !== 'All' && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center space-x-2 text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Showing only <strong>&ldquo;{selectedSubtopic}&rdquo;</strong> videos
                </span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px]">
                  {filteredVideos.length} matching {filteredVideos.length === 1 ? 'video' : 'videos'}
                </span>
              </div>
              <button
                onClick={() => setSelectedSubtopic('All')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-bold hover:underline"
              >
                Show All Videos
              </button>
            </div>
          )}

          {/* Video Cards Grid */}
          {isFeedLoading ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs text-indigo-300 animate-pulse px-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>
                  Fetching real-time educational videos from YouTube for{' '}
                  <strong className="text-white">
                    {focusRule?.isActive && focusRule.targetTopic
                      ? focusRule.targetTopic
                      : selectedSubtopic !== 'All'
                      ? selectedSubtopic
                      : 'Data Structures & Algorithms'}
                  </strong>
                  ...
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 flex flex-col justify-between animate-pulse"
                  >
                    <div className="aspect-video w-full bg-slate-800/80" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-800 rounded w-5/6" />
                      <div className="h-3 bg-slate-800 rounded w-1/2" />
                      <div className="flex items-center space-x-2 pt-2">
                        <div className="w-7 h-7 rounded-full bg-slate-800 shrink-0" />
                        <div className="space-y-1 w-full">
                          <div className="h-3 bg-slate-800 rounded w-2/3" />
                          <div className="h-2.5 bg-slate-800 rounded w-1/3" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {displayedVideos.map((video) => {
              const evalResult = evaluateVideoAgainstRule(video, focusRule);
              const isBlocked = isFocusActive && !evalResult.isAllowed;

              return (
                <div
                  key={video.id}
                  onClick={() => handleVideoClick(video)}
                  className={`group rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between ${
                    isBlocked
                      ? 'bg-slate-900/60 border-rose-900/40 hover:border-rose-700/60 opacity-80'
                      : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/50 hover:shadow-xl'
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleThumbnailError(e, video.youtubeId, video.title, video.subtopic)}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                        isBlocked ? 'filter grayscale blur-[1px]' : ''
                      }`}
                    />

                    {/* Duration Badge */}
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[10px] font-mono text-white font-semibold">
                      {video.duration}
                    </span>

                    {/* Shield Status Badge */}
                    <div className="absolute top-2 left-2">
                      {isBlocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600/90 text-white flex items-center gap-1 shadow-lg">
                          <Lock className="w-2.5 h-2.5" />
                          Distraction Intercepted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600/90 text-white flex items-center gap-1 shadow-lg">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          {video.difficulty || video.subtopic || (focusRule?.targetTopic ? focusRule.targetTopic.slice(0, 15) : 'Verified')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content Row */}
                  <div className="p-3.5 flex space-x-3 flex-1">
                    <img
                      src={video.channelAvatar}
                      alt={video.channelTitle}
                      referrerPolicy="no-referrer"
                      onError={(e) => handleAvatarError(e, video.channelTitle)}
                      className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0 mt-0.5"
                    />

                    <div className="flex-1 space-y-1">
                      <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                        {video.title}
                      </h3>

                      <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                        <span className="truncate">{video.channelTitle}</span>
                        <CheckCircle2 className="w-3 h-3 text-slate-500 fill-slate-500 text-slate-900 inline shrink-0" />
                      </div>

                      <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                        <span>{video.views}</span>
                        <span>•</span>
                        <span>{video.uploadDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {filteredVideos.length === 0 && !isFeedLoading && (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <h3 className="font-bold text-sm text-white">No matching videos found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try searching for specific algorithm topics like &ldquo;Dynamic Programming&rdquo;, &ldquo;Binary Search Tree&rdquo;, or &ldquo;NeetCode&rdquo;.
              </p>
              <button
                onClick={() => fetchEducationalFeed(selectedSubtopic, true)}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Fetch Educational Videos from YouTube</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL: PASTE ANY YOUTUBE URL OR VIDEO ID */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">Screen Any YouTube URL</h3>
              </div>
              <button
                onClick={() => setShowUrlModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste any YouTube video or livestream link. FocusShield will inspect its content in real-time against your active focus intent.
            </p>

            <form onSubmit={handleInspectUrl} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  YouTube Video Link or ID
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {urlError && (
                <p className="text-xs text-rose-400 font-medium">
                  {urlError}
                </p>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUrlModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInspectingUrl || !urlInput.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isInspectingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Screening with AI...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Inspect &amp; Play</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: SHORTS BLOCKED NOTIFICATION */}
      {showShortsBlockedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-rose-900/50 p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
              <Film className="w-7 h-7" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">YouTube Shorts Hard-Locked</h3>
              <p className="text-xs text-rose-300 mt-1">
                Short-form infinite feeds are disabled during focus sessions.
              </p>
            </div>

            <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
              &ldquo;Algorithmically engineered short-form loops fragment working memory and induce cognitive fatigue. Stick to long-form concept mastery.&rdquo;
            </p>

            <button
              onClick={() => setShowShortsBlockedModal(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all"
            >
              Back to Long-Form Focus Tutorials
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL: DISTRACTION INTERCEPTED GUARD WITH REASON & EMERGENCY BYPASS */}
      {blockedModalVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-950 border border-rose-900/60 p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto shadow-xl">
              <ShieldAlert className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-900">
                FocusShield Gatekeeper
              </span>
              <h2 className="text-base font-extrabold text-white mt-1">
                Distraction Intercepted!
              </h2>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1.5">
              <h4 className="text-xs font-bold text-white line-clamp-1">
                {blockedModalVideo.video.title}
              </h4>
              <p className="text-[11px] text-rose-300 leading-relaxed">
                {blockedModalVideo.reason}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 font-medium">
              Active Focus Goal: <strong>{focusRule?.targetTopic || 'Educational Focus'}</strong>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {Math.floor((focusRule?.remainingSeconds || 0) / 60)} minutes remaining in locked session.
              </div>
            </div>

            {/* Emergency Unlock Math Challenge Gate */}
            {showChallenge ? (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/40 text-left space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Algorithmic Emergency Bypass Challenge:</span>
                </div>
                <p className="text-xs text-slate-300">
                  What is the worst-case time complexity of QuickSort when bad pivots are chosen?
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={challengeAnswer}
                    onChange={(e) => {
                      setChallengeAnswer(e.target.value);
                      setChallengeError(false);
                    }}
                    placeholder="Enter complexity (e.g., O(N^2) or n^2)..."
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const ans = challengeAnswer.toLowerCase().replace(/\s/g, '');
                      if (ans.includes('n^2') || ans.includes('n2') || ans.includes('o(n^2)') || ans.includes('o(n*n)')) {
                        playSuccessChime();
                        setActivePlayingVideo(blockedModalVideo.video);
                        setBlockedModalVideo(null);
                        setShowChallenge(false);
                      } else {
                        setChallengeError(true);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-500"
                  >
                    Submit
                  </button>
                </div>
                {challengeError && (
                  <p className="text-[11px] text-rose-400 font-medium">
                    Incorrect! Remember: degenerate unbalanced partitions yield O(N^2).
                  </p>
                )}
              </div>
            ) : null}

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setBlockedModalVideo(null);
                  setShowChallenge(false);
                }}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
              >
                Return to Verified Focus Tutorials
              </button>

              {!showChallenge && (
                <button
                  onClick={() => setShowChallenge(true)}
                  className="text-[11px] text-slate-500 hover:text-slate-400 block w-full py-1"
                >
                  Emergency Bypass (Requires Algorithm Quiz)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: EXTERNAL YOUTUBE LOCKDOWN GUARDIAN (PREVENTS UNRESTRICTED YOUTUBE BROWSING) */}
      {activePlayingVideo && (
        <ExternalLockdownGuardianModal
          video={activePlayingVideo}
          focusRule={focusRule}
          isOpen={showExternalGuardianModal}
          onClose={() => setShowExternalGuardianModal(false)}
          onContinueSafePlayer={() => {
            setShowExternalGuardianModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onLoggedBypass={() => {
            onDistractionBlocked(
              activePlayingVideo,
              `External YouTube link accessed: User requested external navigation during active "${focusRule?.targetTopic || 'Focus'}" lockdown.`
            );
          }}
        />
      )}

      {/* 8. MODAL: UNIVERSAL EXTERNAL YOUTUBE ENFORCER GUIDE */}
      <ExternalYouTubeEnforcerModal
        isOpen={showEnforcerModal}
        onClose={() => setShowEnforcerModal(false)}
      />
    </div>
  );
};
