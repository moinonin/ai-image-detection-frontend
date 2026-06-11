const DEFAULT_API_BASE = "https://imageclassifi.fly.dev";

async function settings() {
  return browser.storage.local.get({ apiBase: DEFAULT_API_BASE });
}

function extractSignatureToken(text) {
  const match = String(text || "").match(
    /(?:NS-SIG-LINK:\s*(?:ns_sig=)?|ns_sig=|NS-SIGNATURE:\s*)((?:v1c|v1)\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,})/i
  );
  return match ? match[1] : "";
}

async function selectedMessage() {
  const tabs = await browser.mailTabs.query({ active: true, currentWindow: true });
  if (!tabs.length) throw new Error("No active mail tab");
  const selection = await browser.mailTabs.getSelectedMessages(tabs[0].id);
  if (!selection.messages.length) throw new Error("No message selected");
  return selection.messages[0];
}

async function verifySelected() {
  const message = await selectedMessage();
  const rawValue = await browser.messages.getRaw(message.id);
  const raw = rawValue && typeof rawValue.text === "function"
    ? await rawValue.text()
    : String(rawValue || "");
  const token = extractSignatureToken(raw);
  const { apiBase } = await settings();
  const base = String(apiBase).replace(/\/+$/, "");
  const path = token
    ? "/api/v1/ns-stego/verify-signature"
    : "/api/v1/ns-stego/verify-email";
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(token ? { token } : { raw }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.detail?.message || data?.detail || "Verification failed");
  const verified =
    data.verified === true ||
    data.valid === true ||
    ["verified", "active", "ok"].includes(String(data.status || "").toLowerCase());
  const metadata = data.payload || data.metadata || {};
  const detail = [
    metadata.sender ? `Sender: ${metadata.sender}` : "",
    metadata.issuer_name ? `Issuer: ${metadata.issuer_name}` : "",
    metadata.timestamp ? `Timestamp: ${metadata.timestamp}` : "",
    data.reason ? `Reason: ${data.reason}` : "",
  ].filter(Boolean).join("\n");
  await browser.notifications.create({
    type: "basic",
    title: verified ? "Provenance verified" : "Provenance not verified",
    message: detail || "No additional verification details were returned.",
  });
  return { verified, data };
}

browser.runtime.onInstalled.addListener(() => {
  browser.menus.create({
    id: "verify-provenance",
    title: "Verify email provenance",
    contexts: ["message_list", "message_display"],
  });
});

browser.menus.onClicked.addListener((info) => {
  if (info.menuItemId === "verify-provenance") verifySelected().catch(notifyError);
});

browser.runtime.onMessage.addListener((message) => {
  if (message?.type === "verify-selected") {
    return verifySelected()
      .then((result) => ({ ok: true, ...result }))
      .catch((error) => ({ ok: false, error: String(error) }));
  }
});

browser.commands.onCommand.addListener((command) => {
  if (command === "verify-provenance") verifySelected().catch(notifyError);
});

async function notifyError(error) {
  await browser.notifications.create({
    type: "basic",
    title: "Unable to verify",
    message: String(error),
  });
}
