async function load() {
  const { sites = [], enabled = true } =
    await chrome.storage.local.get(["sites", "enabled"]);

  document.getElementById("toggle").checked = enabled;
  renderList(sites);
}

function renderList(sites) {
  const ul = document.getElementById("site-list");
  ul.innerHTML = "";
  sites.forEach((domain, i) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${domain}</span>
      <button data-i="${i}">✕</button>
    `;
    li.querySelector("button").onclick = () => removeSite(i);
    ul.appendChild(li);
  });
}

async function removeSite(index) {
  const { sites = [] } = await chrome.storage.local.get("sites");
  sites.splice(index, 1);
  await chrome.storage.local.set({ sites });
  renderList(sites);
  chrome.runtime.sendMessage({ type: "UPDATE" });
}

document.getElementById("add-btn").onclick = async () => {
  const input = document.getElementById("new-domain");
  const domain = input.value.trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!domain) return;

  const { sites = [] } = await chrome.storage.local.get("sites");
  if (!sites.includes(domain)) {
    sites.push(domain);
    await chrome.storage.local.set({ sites });
    renderList(sites);
    chrome.runtime.sendMessage({ type: "UPDATE" });
  }
  input.value = "";
};

document.getElementById("toggle").onchange = async (e) => {
  await chrome.storage.local.set({ enabled: e.target.checked });
  chrome.runtime.sendMessage({ type: "UPDATE" });
};

load();
