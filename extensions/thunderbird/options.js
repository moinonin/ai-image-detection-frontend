const DEFAULT_API_BASE = "https://imageclassifi.fly.dev";

async function load() {
  const { apiBase } = await browser.storage.local.get({ apiBase: DEFAULT_API_BASE });
  document.getElementById("apiBase").value = apiBase;
}

document.getElementById("save").addEventListener("click", async () => {
  const apiBase = document.getElementById("apiBase").value.trim().replace(/\/+$/, "");
  await browser.storage.local.set({ apiBase });
  document.getElementById("status").textContent = "Saved.";
});

load();
