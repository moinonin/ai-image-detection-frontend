const DEFAULT_API_BASE = "https://imageclassifi.fly.dev";
const input = document.getElementById("apiBase");
const status = document.getElementById("status");

chrome.storage.sync.get({ apiBase: DEFAULT_API_BASE }, ({ apiBase }) => {
  input.value = apiBase;
});

document.getElementById("save").addEventListener("click", async () => {
  const apiBase = input.value.trim().replace(/\/+$/, "");
  try {
    const url = new URL(apiBase);
    const granted = await chrome.permissions.request({ origins: [`${url.origin}/*`] });
    if (!granted) throw new Error("API access was not granted");
    await chrome.storage.sync.set({ apiBase });
    status.textContent = "Saved.";
  } catch (error) {
    status.textContent = String(error);
  }
});
