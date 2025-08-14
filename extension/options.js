async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ backendUrl: "http://localhost:4000" }, resolve);
  });
}
async function setSettings(patch) {
  const current = await getSettings();
  return new Promise((r) => chrome.storage.sync.set({ ...current, ...patch }, r));
}

(async function init() {
  const cfg = await getSettings();
  const input = document.getElementById("backendUrl");
  input.value = cfg.backendUrl;

  document.getElementById("save").onclick = async () => {
    await setSettings({ backendUrl: input.value.trim() });
    alert("Saved!");
  };

  // fetch domains from backend
  try {
    const res = await fetch(cfg.backendUrl + "/domains");
    const list = await res.json();
    const ul = document.getElementById("domains");
    ul.innerHTML = "";
    list.forEach(d => {
      const li = document.createElement("li");
      li.textContent = `${d.domain} – ${d.type}`;
      ul.appendChild(li);
    });
  } catch {
    // ignore
  }
})();
