const $ = (s) => document.querySelector(s);
const getDomain = (url) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; } };

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ trackingEnabled: true, backendUrl: "http://localhost:4000" }, resolve);
  });
}
async function setSettings(patch) {
  const current = await getSettings();
  return new Promise((r) => chrome.storage.sync.set({ ...current, ...patch }, r));
}

(async function init() {
  const cfg = await getSettings();
  $("#toggle").checked = cfg.trackingEnabled;
  $("#backend").textContent = cfg.backendUrl;
  $("#dash").href = cfg.backendUrl.replace(/\/$/, "") + "/dashboard";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $("#domain").textContent = tab?.url ? getDomain(tab.url) : "–";

  $("#toggle").addEventListener("change", async (e) => {
    await setSettings({ trackingEnabled: e.target.checked });
  });

  async function classify(type) {
    const domain = $("#domain").textContent;
    if (!domain || domain === "–") return;
    try {
      await fetch(cfg.backendUrl + "/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, type }) // productive|unproductive
      });
      alert(`Marked ${domain} as ${type}`);
    } catch (e) {
      alert("Failed to update classification");
    }
  }

  $("#markProd").onclick = () => classify("productive");
  $("#markUnprod").onclick = () => classify("unproductive");
})();
