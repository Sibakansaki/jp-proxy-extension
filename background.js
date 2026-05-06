const PROXY_HOST = "你的日本伺服器IP";
const PROXY_PORT = 443;

function buildPAC(domains) {
  const conditions = domains
    .map(d => `dnsDomainIs(host, "${d}")`)
    .join(" ||\n    ");

  return `
    function FindProxyForURL(url, host) {
      if (
        ${conditions}
      ) {
        return "HTTPS ${PROXY_HOST}:${PROXY_PORT}";
      }
      return "DIRECT";
    }
  `;
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

// 啟動時套用
applyProxy();
