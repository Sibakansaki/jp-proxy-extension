const PROXY_HOST = "140.245.92.189";
const PROXY_PORT = 3128;

function buildPAC(domains) {
  const conditions = domains
    .map(d => `dnsDomainIs(host, "${d}")`)
    .join(" ||\n    ");

  return `
    function FindProxyForURL(url, host) {
      if (
        ${conditions}
      ) {
        return "PROXY ${PROXY_HOST}:${PROXY_PORT}";
      }
      return "DIRECT";
    }
  `;
}

async function loadSitesFromJSON() {
  const { sites } = await chrome.storage.local.get("sites");
  if (sites && sites.length > 0) return; // 已經有資料就不覆蓋

  const url = chrome.runtime.getURL("sites.json");
  const res = await fetch(url);
  const data = await res.json();
  const domains = data.map(item => item.domain);
  await chrome.storage.local.set({ sites: domains });
}

async function applyProxy() {
  const { sites = [], enabled = true } =
    await chrome.storage.local.get(["sites", "enabled"]);

  if (!enabled || sites.length === 0) {
    chrome.proxy.settings.clear({ scope: "regular" });
    return;
  }

  chrome.proxy.settings.set({
    value: {
      mode: "pac_script",
      pacScript: { data: buildPAC(sites) }
    },
    scope: "regular"
  });
}

// 監聽來自 popup 的訊息
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "UPDATE") applyProxy();
});

// 啟動時自動載入 sites.json 再套用
loadSitesFromJSON().then(() => applyProxy());
