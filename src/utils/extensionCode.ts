// FocusShield Chrome Extension Source Code & Configuration
// Shared between server (for ZIP generation) and UI (for copy/download)

export const EXTENSION_MANIFEST = `{
  "manifest_version": 3,
  "name": "FocusShield Study Sentinel & Tab Closer",
  "version": "1.2.0",
  "description": "Autonomously blocks distractions and off-task YouTube videos during Dijkstra study sessions.",
  "permissions": [
    "tabs",
    "webNavigation"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": [
        "*://*.youtube.com/*",
        "*://*.instagram.com/*",
        "*://*.reddit.com/*",
        "*://*.tiktok.com/*",
        "*://*.netflix.com/*",
        "*://*.twitter.com/*",
        "*://*.x.com/*"
      ],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ]
}`;

export const EXTENSION_BACKGROUND = `// FocusShield Background Service Worker - V1.2.0
const BLOCKED_DOMAINS = [
  "instagram.com",
  "reddit.com",
  "netflix.com",
  "tiktok.com",
  "twitter.com",
  "x.com",
  "discord.com/channels",
  "twitch.tv"
];

console.log("[FocusShield] 🛡️ Sentinel active: Monitoring distractions and YouTube videos.");

function isBlockedUrl(url) {
  if (!url) return { blocked: false };
  const lower = url.toLowerCase();

  // 1. Check blocked social / entertainment domains
  for (const domain of BLOCKED_DOMAINS) {
    if (lower.includes(domain)) {
      return { blocked: true, reason: \`Blocked domain: \${domain}\` };
    }
  }

  // 2. Instant block for YouTube Shorts (pure distraction)
  if (lower.includes("youtube.com/shorts")) {
    return { blocked: true, reason: "YouTube Shorts is blocked during study sessions." };
  }

  return { blocked: false };
}

function handleTabCheck(tabId, url, title) {
  const result = isBlockedUrl(url);
  if (result.blocked) {
    console.warn(\`[FocusShield] 🚨 Closing distraction tab (\${tabId}):\`, url, result.reason);
    chrome.tabs.remove(tabId, () => {
      console.log(\`[FocusShield] ✅ Tab \${tabId} closed successfully.\`);
    });
  }
}

// 1. Intercept before navigation begins (works when clicking Google search results!)
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    handleTabCheck(details.tabId, details.url);
  }
});

// 2. Intercept on history state update (SPA navigation like YouTube & Twitter)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  if (details.frameId === 0) {
    handleTabCheck(details.tabId, details.url);
  }
});

// 3. Intercept tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  const url = changeInfo.url || tab.url;
  if (url) {
    handleTabCheck(tabId, url, tab.title);
  }
});

// 4. Listen for messages from content script (e.g. when off-task YouTube video detected)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "CLOSE_DISTRACTION_TAB" && sender.tab && sender.tab.id) {
    console.warn("[FocusShield] 🚨 Content script requested close for tab:", sender.tab.id, message.reason);
    chrome.tabs.remove(sender.tab.id);
    sendResponse({ status: "closed" });
  }
});
`;

export const EXTENSION_CONTENT = `// FocusShield Content Script - Injected on YouTube & Distractions
(function () {
  console.log("[FocusShield] Sentinel content script loaded on:", window.location.href);

  const url = window.location.href.toLowerCase();

  // 1. Direct social media termination fallback
  const BLOCKED_DOMAINS = ["instagram.com", "reddit.com", "netflix.com", "tiktok.com", "twitter.com", "x.com"];
  if (BLOCKED_DOMAINS.some(d => url.includes(d))) {
    document.documentElement.innerHTML = \`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:20px;">
        <h1 style="font-size:32px;color:#f43f5e;margin-bottom:12px;">🛡️ FocusShield: Site Blocked</h1>
        <p style="font-size:18px;color:#94a3b8;max-width:500px;margin-bottom:24px;">This site is blocked during your 60-minute Dijkstra algorithm study session.</p>
        <p style="color:#38bdf8;">Closing tab in 2 seconds...</p>
      </div>
    \`;
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "CLOSE_DISTRACTION_TAB", reason: "Direct blocked domain" });
    }, 1500);
    return;
  }

  // 2. YouTube Shorts blocker
  if (url.includes("youtube.com/shorts")) {
    document.documentElement.innerHTML = \`
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:20px;">
        <h1 style="font-size:32px;color:#f43f5e;margin-bottom:12px;">🛡️ FocusShield: Shorts Blocked</h1>
        <p style="font-size:18px;color:#94a3b8;max-width:500px;margin-bottom:24px;">YouTube Shorts are disabled during your focus session.</p>
        <p style="color:#38bdf8;">Closing tab...</p>
      </div>
    \`;
    chrome.runtime.sendMessage({ action: "CLOSE_DISTRACTION_TAB", reason: "YouTube Shorts is not allowed" });
    return;
  }

  // 3. YouTube Watch Page Checker (Allows Dijkstra / C++ videos, blocks unrelated videos)
  const STUDY_KEYWORDS = [
    "dijkstra",
    "algorithm",
    "shortest path",
    "graph",
    "min-heap",
    "priority queue",
    "c++",
    "cpp",
    "abdul bari",
    "leetcode",
    "data structures",
    "coding",
    "programming",
    "godbolt",
    "neetcode",
    "striver",
    "gate smashers",
    "computer science",
    "heap",
    "breadth first",
    "depth first",
    "bellman ford",
    "lofi study",
    "focus music"
  ];

  function evaluateYouTubeVideo() {
    if (!window.location.href.includes("/watch")) return;

    // Wait for video title element to populate
    const titleElem = document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
                      document.querySelector("#title h1") ||
                      document.querySelector("h1.title");

    const pageTitle = (titleElem ? titleElem.innerText : document.title) || "";
    if (!pageTitle || pageTitle.trim() === "YouTube") {
      setTimeout(evaluateYouTubeVideo, 600);
      return;
    }

    const lowerTitle = pageTitle.toLowerCase();
    const isStudyRelated = STUDY_KEYWORDS.some(k => lowerTitle.includes(k));

    // Remove existing banner
    const existing = document.getElementById("focusshield-yt-banner");
    if (existing) existing.remove();

    if (!isStudyRelated) {
      console.warn("[FocusShield] Off-task YouTube video detected:", pageTitle);

      // Pause video playback immediately
      const video = document.querySelector("video");
      if (video) video.pause();

      // Show full-screen lockout banner
      const overlay = document.createElement("div");
      overlay.id = "focusshield-yt-banner";
      overlay.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.97);
        z-index: 99999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #fff;
        padding: 24px;
        box-sizing: border-box;
      \`;

      overlay.innerHTML = \`
        <div style="max-width: 600px; text-align: center; background: #1e293b; padding: 36px; border-radius: 20px; border: 2px solid #f43f5e; box-shadow: 0 25px 50px -12px rgba(244, 63, 94, 0.3);">
          <div style="font-size: 52px; margin-bottom: 12px;">🛡️</div>
          <h2 style="font-size: 24px; font-weight: 800; color: #f43f5e; margin: 0 0 12px 0;">Off-Task YouTube Video Blocked!</h2>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 16px;">
            You are in an active session to: <strong style="color: #38bdf8;">"Learn Dijkstra's algorithm in C++"</strong>.
          </p>
          <div style="background: #0f172a; padding: 12px 16px; border-radius: 10px; font-size: 14px; color: #e2e8f0; margin-bottom: 24px; border: 1px solid #334155;">
            Blocked Video: <em>"\${pageTitle}"</em>
          </div>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button id="fs-close-tab" style="background: #f43f5e; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 14px;">
              Close This Tab
            </button>
            <a href="https://www.youtube.com/watch?v=XB4MIexjvY0" style="background: #0284c7; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block;">
              Watch Abdul Bari Dijkstra Lecture ↗
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
            Auto-closing tab in 5 seconds to preserve your focus...
          </p>
        </div>
      \`;

      document.body.appendChild(overlay);

      document.getElementById("fs-close-tab")?.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "CLOSE_DISTRACTION_TAB", reason: "User closed off-task video" });
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: "CLOSE_DISTRACTION_TAB", reason: "Auto-close off-task video" });
      }, 5000);
    } else {
      // Approved study video
      console.log("[FocusShield] ✅ Approved Dijkstra study video:", pageTitle);
      const badge = document.createElement("div");
      badge.id = "focusshield-yt-banner";
      badge.style.cssText = \`
        position: fixed;
        top: 64px;
        right: 20px;
        background: #064e3b;
        border: 1px solid #10b981;
        color: #6ee7b7;
        padding: 8px 14px;
        border-radius: 9999px;
        font-family: sans-serif;
        font-size: 12px;
        font-weight: 700;
        z-index: 999999;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      \`;
      badge.innerHTML = \`<span>🛡️ FocusShield:</span> <span>Dijkstra Study Video Approved</span>\`;
      document.body.appendChild(badge);
      setTimeout(() => {
        if (badge) badge.style.opacity = "0.7";
      }, 4000);
    }
  }

  // Hook into YouTube navigation
  window.addEventListener("yt-navigate-finish", () => {
    setTimeout(evaluateYouTubeVideo, 600);
  });
  window.addEventListener("load", () => {
    setTimeout(evaluateYouTubeVideo, 800);
  });
  setTimeout(evaluateYouTubeVideo, 1200);
})();
`;
