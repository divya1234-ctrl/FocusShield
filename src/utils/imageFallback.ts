import React from 'react';

/**
 * Safe Image Fallback Utilities
 * Ensures video thumbnails and creator avatars never show broken image icons.
 */

// Generate an inline SVG gradient fallback with initials or topic
export const getSvgFallbackThumbnail = (title: string = 'DSA Video', topic: string = 'ALGORITHMS'): string => {
  const cleanTitle = title.replace(/[<>&"]/g, '').slice(0, 45);
  const cleanTopic = topic.replace(/[<>&"]/g, '').toUpperCase();
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="100%" height="100%">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="50%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#020617"/>
      </linearGradient>
      <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#ec4899"/>
      </linearGradient>
    </defs>
    <rect width="640" height="360" fill="url(#bg)"/>
    <circle cx="580" cy="60" r="140" fill="#4338ca" opacity="0.15"/>
    <circle cx="80" cy="300" r="180" fill="#3b82f6" opacity="0.12"/>
    
    <!-- Code Bracket Icon -->
    <rect x="40" y="40" width="56" height="56" rx="14" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <path d="M62 60 L54 68 L62 76 M74 60 L82 68 L74 76" stroke="#818cf8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>

    <!-- Topic Badge -->
    <rect x="110" y="52" width="140" height="30" rx="15" fill="#312e81" stroke="#4f46e5" stroke-width="1.5"/>
    <text x="180" y="72" fill="#c7d2fe" font-size="12" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1.5">${cleanTopic}</text>

    <!-- Title -->
    <text x="40" y="160" fill="#ffffff" font-size="24" font-family="system-ui, -apple-system, sans-serif" font-weight="800" width="560">
      ${cleanTitle}
    </text>

    <!-- Decorative Bottom Bar -->
    <rect x="40" y="310" width="560" height="4" rx="2" fill="url(#glow)"/>
    <text x="40" y="295" fill="#94a3b8" font-size="13" font-family="system-ui, -apple-system, sans-serif" font-weight="600">FocusShield Verified Study Stream</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Generate an SVG avatar with creator initials
export const getSvgAvatar = (name: string = 'DSA'): string => {
  const initial = (name.trim().charAt(0) || 'C').toUpperCase();
  const colors = [
    ['#312e81', '#6366f1'],
    ['#065f46', '#10b981'],
    ['#831843', '#ec4899'],
    ['#7c2d12', '#f97316'],
    ['#1e1b4b', '#818cf8']
  ];
  const colorIndex = Math.abs(name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
  const [c1, c2] = colors[colorIndex];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <linearGradient id="avGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#avGrad)"/>
    <text x="50" y="62" fill="#ffffff" font-size="40" font-family="system-ui, -apple-system, sans-serif" font-weight="bold" text-anchor="middle">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

// Return canonical YouTube Thumbnail
export const getYoutubeThumbnailUrl = (youtubeId?: string): string => {
  if (!youtubeId) return getSvgFallbackThumbnail();
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
};

// Handle Thumbnail Error
export const handleThumbnailError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  youtubeId?: string,
  title?: string,
  subtopic?: string
) => {
  const target = e.currentTarget;
  // If the high quality thumb failed, try mqdefault, then fallback to SVG
  if (youtubeId && target.src.includes('hqdefault.jpg')) {
    target.src = `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`;
  } else {
    // Break any recursive error loops and show clean SVG fallback
    target.onerror = null;
    target.src = getSvgFallbackThumbnail(title || 'Study Masterclass', subtopic || 'EDUCATIONAL');
  }
};

// Handle Avatar Error
export const handleAvatarError = (
  e: React.SyntheticEvent<HTMLImageElement>,
  channelTitle?: string
) => {
  const target = e.currentTarget;
  target.onerror = null;
  target.src = getSvgAvatar(channelTitle || 'Channel');
};
