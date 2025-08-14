// ===== Config =====
const DEFAULTS = {
  trackingEnabled: true,
  backendUrl: "http://localhost:4000"
};

// ===== State =====
let activeTabId = null;
let activeDomain = null;
let lastTick = Date.now();
let isWindowFocused = true;
let isIdle = false;

// ===== Helpers =====
const getDomain = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return null; }
};

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULTS, resolve);
  });
}

async function setSettings(patch) {
  const current = await getSettings();
  return new Promise((resolve) => {
    chrome.storage.sync.set({ ...current, ...patch }, resolve);
  });
}

async function sendBatch(domain, seconds) {
  const { backendUrl } = await getSettings();
  if (!backendUrl) return;
  try {
    await fetch(`${backendUrl}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: `https://${domain}`,
        seconds,
        dateISO: new Date().toISOString()
      })
    });
  } catch (e) {
    // swallow network errors, try next time
  }
}

async function commitDelta() {
  const { trackingEnabled } = await getSettings();
  if (!trackingEnabled || !isWindowFocused || isIdle) return;

  const now = Date.now();
  const seconds = Math.floor((now - lastTick) / 1000);
  lastTick = now;

  if (activeDomain && seconds > 0 && seconds <= 60 * 5) {
    // ignore huge spikes; batch-send
    sendBatch(activeDomain, seconds);
  }
}

async function refreshActive(tabId) {
  const { trackingEnabled } = await getSettings();
  if (!trackingEnabled) return;

  if (tabId == null) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    tabId = tab.id;
  }
  try {
    const tab = await chrome.tabs.get(tabId);
    const domain = getDomain(tab.url);
    if (!domain) return;
    await commitDelta(); // commit the previous domain time before switching
    activeTabId = tabId;
    activeDomain = domain;
    lastTick = Date.now();
  } catch {
    // tab may be gone
  }
}

// ===== Listeners =====
chrome.tabs.onActivated.addListener(({ tabId }) => refreshActive(tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.status === "complete") {
    refreshActive(tabId);
  }
});
chrome.windows.onFocusChanged.addListener((winId) => {
  isWindowFocused = winId !== chrome.windows.WINDOW_ID_NONE;
  lastTick = Date.now();
});
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener((state) => {
  isIdle = state !== "active";
  lastTick = Date.now();
});

// heartbeat every 15s
setInterval(() => { commitDelta(); }, 15000);

// initialize
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    activeTabId = tab.id;
    activeDomain = getDomain(tab.url);
    lastTick = Date.now();
  }
})();
