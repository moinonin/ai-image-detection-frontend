const DEFAULT_API_BASE = "https://imageclassifi.fly.dev";

function setStatus(title, detail = "", verified = false) {
  const status = document.getElementById("status");
  status.textContent = title;
  status.className = `pill ${verified ? "verified" : "unverified"}`;
  document.getElementById("meta").textContent = detail;
}

function extractSignatureToken(text) {
  const match = String(text || "").match(
    /(?:NS-SIG-LINK:\s*(?:ns_sig=)?|ns_sig=|NS-SIGNATURE:\s*)((?:v1c|v1)\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,})/i
  );
  return match ? match[1] : "";
}

function getBody(item) {
  return new Promise((resolve, reject) => {
    item.body.getAsync("text", (result) => {
      if (result.status === Office.AsyncResultStatus.Succeeded) resolve(result.value || "");
      else reject(new Error("Unable to read the message body"));
    });
  });
}

function getHeaders(item) {
  return new Promise((resolve) => {
    item.getAllInternetHeadersAsync((result) => {
      resolve(result.status === Office.AsyncResultStatus.Succeeded ? result.value || "" : "");
    });
  });
}

async function verifyMessage() {
  setStatus("Verifying...");
  try {
    const item = Office.context.mailbox.item;
    const [headers, body] = await Promise.all([getHeaders(item), getBody(item)]);
    const apiBase = (localStorage.getItem("apiBase") || DEFAULT_API_BASE).replace(/\/+$/, "");
    const token = extractSignatureToken(body);
    const path = token
      ? "/api/v1/ns-stego/verify-signature"
      : "/api/v1/ns-stego/verify-email";
    const payload = token ? { token } : { raw: `${headers}\r\n\r\n${body}` };
    const response = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
    setStatus(verified ? "Provenance verified" : "Provenance not verified", detail, verified);
  } catch (error) {
    setStatus("Unable to verify", String(error), false);
  }
}

function loadSettings() {
  document.getElementById("apiBase").value =
    localStorage.getItem("apiBase") || DEFAULT_API_BASE;
}

function saveSettings() {
  localStorage.setItem(
    "apiBase",
    document.getElementById("apiBase").value.trim().replace(/\/+$/, "")
  );
  document.getElementById("saved").textContent = "Saved.";
}

document.getElementById("verify").addEventListener("click", verifyMessage);
document.getElementById("save").addEventListener("click", saveSettings);
Office.onReady(loadSettings);
