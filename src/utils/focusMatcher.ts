import { VideoItem, FocusIntentRule } from '../types';

export interface VideoEvaluationResult {
  isAllowed: boolean;
  relevanceScore: number;
  reason: string;
}

/**
 * Determine if a video is allowed based on the active FocusIntentRule
 */
export function evaluateVideoAgainstRule(
  video: VideoItem,
  rule: FocusIntentRule | null
): VideoEvaluationResult {
  // If focus shield is inactive, permit educational videos
  if (!rule || !rule.isActive) {
    const isLeisure = video.category === 'gaming' || video.category === 'vlog' || video.category === 'entertainment';
    return {
      isAllowed: !isLeisure,
      relevanceScore: isLeisure ? 10 : 85,
      reason: isLeisure ? 'Entertainment video (Permitted outside active focus mode)' : 'Educational material approved.'
    };
  }

  // 1. Entertainment & non-study videos are ALWAYS blocked when focus is active
  const isHardDistraction =
    video.category === 'gaming' ||
    video.category === 'vlog' ||
    video.category === 'entertainment' ||
    !video.isDsaVideo; // flag for general non-educational items

  if (isHardDistraction) {
    return {
      isAllowed: false,
      relevanceScore: 5,
      reason: `Blocked by FocusShield: "${video.title}" is classified as leisure/entertainment, which is strictly prohibited while studying ${rule.targetTopic}.`
    };
  }

  const targetTopic = (rule.targetTopic || '').toLowerCase();
  const title = (video.title || '').toLowerCase();
  const desc = (video.description || '').toLowerCase();
  const subtopic = (video.subtopic || '').toLowerCase();
  const category = (video.category || '').toLowerCase();
  const tags = (video.tags || []).map((t) => t.toLowerCase());
  const combinedText = `${title} ${desc} ${subtopic} ${category} ${tags.join(' ')}`;

  // 2. Machine Learning & AI
  const isMlTopic =
    targetTopic.includes('machine learning') ||
    targetTopic.includes('deep learning') ||
    targetTopic.includes('neural') ||
    targetTopic.includes(' ai') ||
    targetTopic.startsWith('ai') ||
    targetTopic.includes('artificial intelligence') ||
    targetTopic.includes('transformer') ||
    targetTopic.includes('gpt') ||
    targetTopic.includes('llm');

  if (isMlTopic) {
    const matchesMl =
      category === 'ai' ||
      subtopic.includes('neural') ||
      subtopic.includes('transformer') ||
      subtopic.includes('llm') ||
      subtopic.includes('machine learning') ||
      combinedText.includes('machine learning') ||
      combinedText.includes('deep learning') ||
      combinedText.includes('neural network') ||
      combinedText.includes('transformer') ||
      combinedText.includes('gpt') ||
      combinedText.includes('llm') ||
      combinedText.includes('backpropagation') ||
      combinedText.includes('gradient descent') ||
      combinedText.includes('statquest');

    if (matchesMl) {
      return {
        isAllowed: true,
        relevanceScore: 96,
        reason: `Verified educational match for your active focus goal: "${rule.targetTopic}".`
      };
    } else {
      return {
        isAllowed: false,
        relevanceScore: 20,
        reason: `Blocked: FocusShield is currently locked strictly to "${rule.targetTopic}". Other subject areas are paused to prevent context-switching.`
      };
    }
  }

  // 3. Web Development & Fullstack
  const isWebTopic =
    targetTopic.includes('web') ||
    targetTopic.includes('react') ||
    targetTopic.includes('fullstack') ||
    targetTopic.includes('next.js') ||
    targetTopic.includes('frontend') ||
    targetTopic.includes('node');

  if (isWebTopic) {
    const matchesWeb =
      category === 'web' ||
      subtopic.includes('web') ||
      subtopic.includes('react') ||
      subtopic.includes('frontend') ||
      combinedText.includes('react') ||
      combinedText.includes('next.js') ||
      combinedText.includes('fullstack') ||
      combinedText.includes('typescript') ||
      combinedText.includes('javascript') ||
      combinedText.includes('web dev');

    if (matchesWeb) {
      return {
        isAllowed: true,
        relevanceScore: 95,
        reason: `Verified web development curriculum matching "${rule.targetTopic}".`
      };
    } else {
      return {
        isAllowed: false,
        relevanceScore: 20,
        reason: `Blocked: Active study intent is set to "${rule.targetTopic}".`
      };
    }
  }

  // 4. System Design & Architecture
  const isSdTopic =
    targetTopic.includes('system design') ||
    targetTopic.includes('architecture') ||
    targetTopic.includes('distributed') ||
    targetTopic.includes('scalability') ||
    targetTopic.includes('database');

  if (isSdTopic) {
    const matchesSd =
      category === 'system-design' ||
      subtopic.includes('system design') ||
      combinedText.includes('system design') ||
      combinedText.includes('distributed systems') ||
      combinedText.includes('indexing') ||
      combinedText.includes('scalability') ||
      combinedText.includes('load balancer') ||
      combinedText.includes('bytebytego');

    if (matchesSd) {
      return {
        isAllowed: true,
        relevanceScore: 94,
        reason: `Verified System Design tutorial matching "${rule.targetTopic}".`
      };
    } else {
      return {
        isAllowed: false,
        relevanceScore: 20,
        reason: `Blocked: Active study intent is set to "${rule.targetTopic}".`
      };
    }
  }

  // 5. Mathematics & Science
  const isMathTopic =
    targetTopic.includes('math') ||
    targetTopic.includes('science') ||
    targetTopic.includes('calculus') ||
    targetTopic.includes('linear algebra') ||
    targetTopic.includes('physics');

  if (isMathTopic) {
    const matchesMath =
      category === 'math' ||
      category === 'science' ||
      subtopic.includes('linear algebra') ||
      subtopic.includes('calculus') ||
      combinedText.includes('linear algebra') ||
      combinedText.includes('calculus') ||
      combinedText.includes('math') ||
      combinedText.includes('physics') ||
      combinedText.includes('3blue1brown');

    if (matchesMath) {
      return {
        isAllowed: true,
        relevanceScore: 95,
        reason: `Verified Mathematics/Science content matching "${rule.targetTopic}".`
      };
    } else {
      return {
        isAllowed: false,
        relevanceScore: 20,
        reason: `Blocked: Focus is dedicated to "${rule.targetTopic}".`
      };
    }
  }

  // 6. Specific DSA subtopic focus (Graph, DP, Trees, Sorting, Two Pointers)
  if (targetTopic.includes('graph')) {
    const matchesGraph = subtopic.includes('graph') || combinedText.includes('graph') || combinedText.includes('bfs') || combinedText.includes('dfs') || combinedText.includes('dijkstra');
    if (matchesGraph) {
      return { isAllowed: true, relevanceScore: 98, reason: 'Verified Graph Theory & Algorithms tutorial.' };
    }
    return { isAllowed: false, relevanceScore: 25, reason: `Blocked: Focus is locked onto Graph Algorithms.` };
  }

  if (targetTopic.includes('dynamic programming') || targetTopic.includes('dp')) {
    const matchesDp = subtopic.includes('dynamic programming') || combinedText.includes('dynamic programming') || combinedText.includes('knapsack') || combinedText.includes('memoization');
    if (matchesDp) {
      return { isAllowed: true, relevanceScore: 98, reason: 'Verified Dynamic Programming study content.' };
    }
    return { isAllowed: false, relevanceScore: 25, reason: `Blocked: Focus is locked onto Dynamic Programming.` };
  }

  if (targetTopic.includes('tree') || targetTopic.includes('trie') || targetTopic.includes('bst')) {
    const matchesTree = subtopic.includes('tree') || subtopic.includes('trie') || combinedText.includes('tree') || combinedText.includes('trie') || combinedText.includes('bst') || combinedText.includes('inorder');
    if (matchesTree && !combinedText.includes('graph')) {
      return { isAllowed: true, relevanceScore: 98, reason: 'Verified Tree & Trie Algorithms tutorial.' };
    }
    return { isAllowed: false, relevanceScore: 25, reason: `Blocked: Focus is locked onto Trees & Tries.` };
  }

  if (targetTopic.includes('sort') || targetTopic.includes('divide')) {
    const matchesSort = subtopic.includes('sort') || subtopic.includes('divide') || combinedText.includes('sort') || combinedText.includes('divide and conquer') || combinedText.includes('binary search');
    if (matchesSort) {
      return { isAllowed: true, relevanceScore: 98, reason: 'Verified Sorting & Divide and Conquer tutorial.' };
    }
    return { isAllowed: false, relevanceScore: 25, reason: `Blocked: Focus is locked onto Sorting Algorithms.` };
  }

  if (targetTopic.includes('pointer') || targetTopic.includes('sliding') || targetTopic.includes('two sum')) {
    const matchesPointer = subtopic.includes('pointer') || subtopic.includes('sliding') || combinedText.includes('two pointer') || combinedText.includes('sliding window');
    if (matchesPointer) {
      return { isAllowed: true, relevanceScore: 98, reason: 'Verified Arrays & Two Pointers tutorial.' };
    }
    return { isAllowed: false, relevanceScore: 25, reason: `Blocked: Focus is locked onto Arrays & Two Pointers.` };
  }

  // 7. General DSA (Data Structures & Algorithms)
  const isGeneralDsa =
    targetTopic.includes('dsa') ||
    targetTopic.includes('data structure') ||
    targetTopic.includes('algorithm') ||
    targetTopic.includes('leetcode');

  if (isGeneralDsa) {
    const matchesDsa = category === 'dsa' || subtopic.includes('dsa') || subtopic.includes('graph') || subtopic.includes('tree') || subtopic.includes('dynamic') || subtopic.includes('sort') || subtopic.includes('pointer');
    if (matchesDsa) {
      return {
        isAllowed: true,
        relevanceScore: 92,
        reason: `Verified DSA educational material matching "${rule.targetTopic}".`
      };
    } else {
      return {
        isAllowed: false,
        relevanceScore: 25,
        reason: `Blocked: Focus is currently locked onto Data Structures & Algorithms (DSA).`
      };
    }
  }

  // 8. Custom user keywords match
  if (rule.allowedKeywords && rule.allowedKeywords.length > 0) {
    const hasKeywordMatch = rule.allowedKeywords.some((kw) => {
      const cleanKw = kw.toLowerCase().trim();
      return cleanKw.length > 2 && combinedText.includes(cleanKw);
    });

    if (hasKeywordMatch) {
      return {
        isAllowed: true,
        relevanceScore: 90,
        reason: `Approved match for your custom focus keywords.`
      };
    }
  }

  // Fallback: If not explicitly matching target topic
  return {
    isAllowed: false,
    relevanceScore: 30,
    reason: `Blocked: Off-topic for active focus goal "${rule.targetTopic}".`
  };
}

/**
 * Helper to get the matching subtopic filter tab for a given topic string
 */
export function getSubtopicForFocusRule(targetTopic?: string): string {
  if (!targetTopic) return 'All';
  const lower = targetTopic.toLowerCase();
  if (lower.includes('machine learning') || lower.includes('ai') || lower.includes('neural') || lower.includes('deep learning')) {
    return 'AI & Machine Learning';
  }
  if (lower.includes('graph') || lower.includes('bfs') || lower.includes('dfs')) {
    return 'Graph Algorithms';
  }
  if (lower.includes('tree') || lower.includes('trie') || lower.includes('bst')) {
    return 'Trees & Tries';
  }
  if (lower.includes('dynamic programming') || lower.includes('dp') || lower.includes('knapsack')) {
    return 'Dynamic Programming';
  }
  if (lower.includes('sort') || lower.includes('divide')) {
    return 'Sorting & Divide and Conquer';
  }
  if (lower.includes('pointer') || lower.includes('sliding') || lower.includes('two sum')) {
    return 'Arrays & Two Pointers';
  }
  if (lower.includes('system design') || lower.includes('architecture') || lower.includes('database')) {
    return 'System Design';
  }
  if (lower.includes('web') || lower.includes('react') || lower.includes('fullstack') || lower.includes('node')) {
    return 'Web Development';
  }
  if (lower.includes('math') || lower.includes('science') || lower.includes('physics') || lower.includes('calculus')) {
    return 'Mathematics & Science';
  }
  if (lower.includes('dsa') || lower.includes('algorithm') || lower.includes('leetcode')) {
    return 'DSA Core';
  }
  return 'All';
}
