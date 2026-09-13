// FocusShield Chrome Extension Source Code & Configuration - V1.3.0
// Shared between server (for ZIP generation), /extension directory, and UI

export const EXTENSION_MANIFEST = `{
  "manifest_version": 3,
  "name": "FocusShield Study Sentinel & Tab Closer",
  "version": "1.3.0",
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
      "run_at": "document_end"
    }
  ]
}`;

export const EXTENSION_BACKGROUND = `// FocusShield Background Service Worker - V1.3.0
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

console.log("[FocusShield V1.3] 🛡️ Sentinel active: Monitoring distractions and YouTube study mode.");

function isBlockedUrl(url) {
  if (!url) return { blocked: false };
  const lower = url.toLowerCase();

  // 1. Social & entertainment domains
  for (const domain of BLOCKED_DOMAINS) {
    if (lower.includes(domain)) {
      return { blocked: true, reason: \`Blocked domain: \${domain}\` };
    }
  }

  // 2. YouTube Shorts (pure algorithmic distraction)
  if (lower.includes("youtube.com/shorts")) {
    return { blocked: true, reason: "YouTube Shorts blocked during Dijkstra study session." };
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

// 1. Intercept before navigation begins
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    handleTabCheck(details.tabId, details.url);
  }
});

// 2. Intercept on history state update (SPA navigation)
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

// 4. Handle direct close requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.action === "CLOSE_DISTRACTION_TAB" && sender.tab && sender.tab.id) {
    console.warn("[FocusShield] 🚨 Content script requested close for tab:", sender.tab.id, message.reason);
    chrome.tabs.remove(sender.tab.id);
    sendResponse({ status: "closed" });
  }
});
`;

export const EXTENSION_CONTENT = `// FocusShield Content Script - Injected on YouTube & Distraction Sites (V1.3.0)
(function () {
  console.log("[FocusShield V1.3] Sentinel content script loaded on:", window.location.href);

  const url = window.location.href.toLowerCase();

  // 1. Instant Social Media Termination
  const BLOCKED_DOMAINS = ["instagram.com", "reddit.com", "netflix.com", "tiktok.com", "twitter.com", "x.com"];
  if (BLOCKED_DOMAINS.some(d => url.includes(d))) {
    const root = document.body || document.documentElement;
    if (root) {
      root.innerHTML = \`
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:24px;">
          <h1 style="font-size:32px;color:#f43f5e;margin-bottom:12px;">🛡️ FocusShield: Site Blocked</h1>
          <p style="font-size:18px;color:#94a3b8;max-width:520px;margin-bottom:24px;">This site is blocked while your Dijkstra's algorithm focus session is active.</p>
          <p style="color:#38bdf8;font-weight:bold;">Closing tab in 1 second...</p>
        </div>
      \`;
    }
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "CLOSE_DISTRACTION_TAB", reason: "Direct blocked domain" });
    }, 1200);
    return;
  }

  // 2. YouTube Shorts blocker
  if (url.includes("youtube.com/shorts")) {
    const root = document.body || document.documentElement;
    if (root) {
      root.innerHTML = \`
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:24px;">
          <h1 style="font-size:32px;color:#f43f5e;margin-bottom:12px;">🛡️ FocusShield: Shorts Disabled</h1>
          <p style="font-size:18px;color:#94a3b8;max-width:520px;margin-bottom:24px;">Shorts are blocked to protect your Dijkstra study momentum.</p>
          <p style="color:#38bdf8;font-weight:bold;">Closing tab...</p>
        </div>
      \`;
    }
    chrome.runtime.sendMessage({ action: "CLOSE_DISTRACTION_TAB", reason: "YouTube Shorts is not allowed" });
    return;
  }

  // 3. YouTube Guard & Intent Locker
  if (!url.includes("youtube.com")) return;

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
    "floyd warshall",
    "lofi study",
    "focus music"
  ];

  // A. Persistent FocusShield Top Status Bar (Shows extension is active on YouTube)
  function injectTopShieldBar() {
    if (document.getElementById("focusshield-yt-topbar")) return;
    const bar = document.createElement("div");
    bar.id = "focusshield-yt-topbar";
    bar.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 38px;
      background: #0f172a;
      border-bottom: 2px solid #6366f1;
      z-index: 9999999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      box-sizing: border-box;
    \`;
    bar.innerHTML = \`
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:16px;">🛡️</span>
        <span style="color:#38bdf8;font-weight:bold;">FocusShield Study Mode Active:</span>
        <span style="color:#94a3b8;">"Learn Dijkstra's algorithm in C++"</span>
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <a href="https://www.youtube.com/results?search_query=dijkstra+algorithm+cpp" style="background:#4f46e5;color:#fff;text-decoration:none;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:bold;">
          🔍 Dijkstra C++ Search
        </a>
        <a href="https://www.youtube.com/watch?v=XB4MIexjvY0" style="background:#0284c7;color:#fff;text-decoration:none;padding:4px 12px;border-radius:6px;font-size:11px;font-weight:bold;">
          ▶ Abdul Bari Lecture
        </a>
      </div>
    \`;
    const target = document.body || document.documentElement;
    if (target) {
      target.appendChild(bar);
    }
  }

  // B. Handle YouTube Homepage (Hide distracting algorithmic feed & provide Dijkstra launcher)
  function handleYouTubeHomepage() {
    const isHomepage = window.location.pathname === "/" || window.location.pathname === "";
    if (!isHomepage) return;

    // Hide algorithmic recommendation feed
    const richGrid = document.querySelector("ytd-rich-grid-renderer");
    if (richGrid && !document.getElementById("focusshield-home-hub")) {
      richGrid.style.display = "none";

      const hub = document.createElement("div");
      hub.id = "focusshield-home-hub";
      hub.style.cssText = \`
        max-width: 900px;
        margin: 60px auto 40px auto;
        padding: 32px;
        background: #1e293b;
        border: 2px solid #6366f1;
        border-radius: 20px;
        color: #fff;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      \`;
      hub.innerHTML = \`
        <div style="font-size:48px;margin-bottom:12px;">🛡️</div>
        <h2 style="font-size:26px;font-weight:800;color:#38bdf8;margin:0 0 8px 0;">FocusShield Study Mode Active</h2>
        <p style="font-size:15px;color:#94a3b8;margin:0 0 24px 0;">Algorithmic homepage distractions are hidden during your Dijkstra C++ study session.</p>
        
        <div style="display:flex;gap:12px;justify-content:center;margin-bottom:28px;flex-wrap:wrap;">
          <input id="fs-search-input" type="text" placeholder="Search Dijkstra, Graph, C++, LeetCode..." style="flex:1;max-width:450px;padding:12px 16px;border-radius:10px;border:1px solid #475569;background:#0f172a;color:#fff;font-size:14px;" value="Dijkstra algorithm in C++" />
          <button id="fs-search-btn" style="background:#6366f1;color:#fff;border:none;padding:12px 24px;border-radius:10px;font-weight:bold;cursor:pointer;font-size:14px;">Search Study Video</button>
        </div>

        <div style="text-align:left;">
          <h3 style="font-size:14px;color:#cbd5e1;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;font-weight:bold;">Recommended Dijkstra Lectures:</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px;">
            <a href="https://www.youtube.com/watch?v=XB4MIexjvY0" style="display:block;padding:16px;background:#0f172a;border:1px solid #334155;border-radius:12px;color:#fff;text-decoration:none;transition:border-color 0.2s;">
              <div style="font-weight:bold;font-size:14px;color:#38bdf8;margin-bottom:4px;">Abdul Bari - Dijkstra's Algorithm</div>
              <div style="font-size:12px;color:#94a3b8;">Comprehensive visual explanation of shortest path</div>
            </a>
            <a href="https://www.youtube.com/results?search_query=neetcode+network+delay+time+dijkstra" style="display:block;padding:16px;background:#0f172a;border:1px solid #334155;border-radius:12px;color:#fff;text-decoration:none;">
              <div style="font-weight:bold;font-size:14px;color:#38bdf8;margin-bottom:4px;">NeetCode - Dijkstra Walkthrough</div>
              <div style="font-size:12px;color:#94a3b8;">LeetCode 743 Priority Queue implementation</div>
            </a>
            <a href="https://www.youtube.com/results?search_query=striver+dijkstra+algorithm+cpp" style="display:block;padding:16px;background:#0f172a;border:1px solid #334155;border-radius:12px;color:#fff;text-decoration:none;">
              <div style="font-weight:bold;font-size:14px;color:#38bdf8;margin-bottom:4px;">Striver - Dijkstra in C++</div>
              <div style="font-size:12px;color:#94a3b8;">C++ STL priority_queue and set implementation</div>
            </a>
          </div>
        </div>
      \`;

      richGrid.parentNode.insertBefore(hub, richGrid);

      document.getElementById("fs-search-btn")?.addEventListener("click", () => {
        const input = document.getElementById("fs-search-input");
        const query = input ? input.value : "dijkstra algorithm";
        window.location.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(query);
      });
    }
  }

  // C. Handle YouTube Video Watch Pages
  function evaluateCurrentVideo() {
    if (!window.location.href.includes("/watch")) return;

    // Get title from standard DOM locations
    const titleElem = document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
                      document.querySelector("#title h1 yt-formatted-string") ||
                      document.querySelector("#title h1") ||
                      document.querySelector("h1.title");

    const pageTitle = (titleElem ? titleElem.innerText : document.title) || "";
    if (!pageTitle || pageTitle.trim() === "YouTube") {
      return;
    }

    const lower = pageTitle.toLowerCase();
    const isStudyRelated = STUDY_KEYWORDS.some(k => lower.includes(k));

    // Remove existing banners if present
    const existingBanner = document.getElementById("focusshield-yt-eval");
    if (existingBanner) existingBanner.remove();

    if (!isStudyRelated) {
      console.warn("[FocusShield] 🚨 Off-task video detected:", pageTitle);

      // Pause playback immediately
      const video = document.querySelector("video");
      if (video) {
        video.pause();
        video.muted = true;
      }

      // Full-screen lockout overlay
      const overlay = document.createElement("div");
      overlay.id = "focusshield-yt-eval";
      overlay.style.cssText = \`
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(15, 23, 42, 0.98);
        z-index: 999999999;
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
        <div style="max-width: 580px; text-align: center; background: #1e293b; padding: 36px; border-radius: 20px; border: 2px solid #f43f5e; box-shadow: 0 25px 50px rgba(244, 63, 94, 0.3);">
          <div style="font-size: 52px; margin-bottom: 12px;">🛡️</div>
          <h2 style="font-size: 24px; font-weight: 800; color: #f43f5e; margin: 0 0 12px 0;">Off-Task YouTube Video Blocked!</h2>
          <p style="font-size: 15px; color: #cbd5e1; line-height: 1.6; margin-bottom: 16px;">
            Your session goal is: <strong style="color: #38bdf8;">"Learn Dijkstra's algorithm in C++"</strong>.
          </p>
          <div style="background: #0f172a; padding: 12px 16px; border-radius: 10px; font-size: 14px; color: #e2e8f0; margin-bottom: 24px; border: 1px solid #334155;">
            Blocked Video: <em>"\${pageTitle}"</em>
          </div>
          <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button id="fs-close-now" style="background: #f43f5e; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; font-size: 14px;">
              Close This Tab
            </button>
            <a href="https://www.youtube.com/watch?v=XB4MIexjvY0" style="background: #0284c7; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 14px;">
              Watch Abdul Bari Dijkstra Lecture ↗
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">
            Auto-closing tab in 3 seconds to preserve your focus...
          </p>
        </div>
      \`;

      const target = document.body || document.documentElement;
      if (target) target.appendChild(overlay);

      document.getElementById("fs-close-now")?.addEventListener("click", () => {
        chrome.runtime.sendMessage({ action: "CLOSE_DISTRACTION_TAB", reason: "User closed off-task video" });
      });

      setTimeout(() => {
        chrome.runtime.sendMessage({ action: "CLOSE_DISTRACTION_TAB", reason: "Auto-close off-task video" });
      }, 3500);
    } else {
      // Approved study video
      console.log("[FocusShield] ✅ Approved study video:", pageTitle);
      const badge = document.createElement("div");
      badge.id = "focusshield-yt-eval";
      badge.style.cssText = \`
        position: fixed;
        top: 48px;
        right: 20px;
        background: #064e3b;
        border: 1px solid #10b981;
        color: #6ee7b7;
        padding: 8px 16px;
        border-radius: 9999px;
        font-family: sans-serif;
        font-size: 12px;
        font-weight: 700;
        z-index: 9999999;
        display: flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      \`;
      badge.innerHTML = \`<span>🛡️ FocusShield:</span> <span>Dijkstra Study Video Approved ✅</span>\`;
      const target = document.body || document.documentElement;
      if (target) target.appendChild(badge);
    }
  }

  // Periodic and event-based scanner
  function runLoop() {
    injectTopShieldBar();
    handleYouTubeHomepage();
    evaluateCurrentVideo();
  }

  // Initial runs
  setTimeout(runLoop, 400);
  setTimeout(runLoop, 1200);
  setInterval(runLoop, 1500);

  window.addEventListener("yt-navigate-finish", () => setTimeout(runLoop, 500));
  window.addEventListener("popstate", () => setTimeout(runLoop, 500));
})();
`;
