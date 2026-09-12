// FocusShield Background Service Worker - V1.2.0
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
      return { blocked: true, reason: `Blocked domain: ${domain}` };
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
    console.warn(`[FocusShield] 🚨 Closing distraction tab (${tabId}):`, url, result.reason);
    chrome.tabs.remove(tabId, () => {
      console.log(`[FocusShield] ✅ Tab ${tabId} closed successfully.`);
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
