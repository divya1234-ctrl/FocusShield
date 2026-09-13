// FocusShield Background Service Worker - V1.3.0
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
      return { blocked: true, reason: `Blocked domain: ${domain}` };
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
    console.warn(`[FocusShield] 🚨 Closing distraction tab (${tabId}):`, url, result.reason);
    chrome.tabs.remove(tabId, () => {
      console.log(`[FocusShield] ✅ Tab ${tabId} closed successfully.`);
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
