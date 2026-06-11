const DEFAULT_API_BASE = "https://imageclassifi.fly.dev";
const PANEL_ID = "veriforensic-email-panel";
const MAX_CERTIFICATE_BYTES = 10 * 1024 * 1024;

async function getSettings() {
  return chrome.storage.sync.get({ apiBase: DEFAULT_API_BASE });
}

function currentMessageText() {
  const bodies = Array.from(document.querySelectorAll("div.a3s"))
    .filter((node) => node.offsetParent !== null)
    .map((node) => (node.innerText || "").trim())
    .filter(Boolean);
  return bodies[bodies.length - 1] || "";
}

function signatureToken(text) {
  const patterns = [
    /NS-SIG-LINK:\s*(?:ns_sig=)?((?:v1c|v1)\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,})/i,
    /ns_sig=((?:v1c|v1)\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,})/i,
    /NS-SIGNATURE:\s*((?:v1c|v1)\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{20,})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return "";
}

function ensurePanel() {
  let panel = document.getElementById(PANEL_ID);
  if (panel) return panel;
  panel = document.createElement("aside");
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <div class="vf-heading">Verify provenance</div>
    <button type="button" class="vf-verify-button">Verify email</button>
    <div class="vf-divider"><span>or</span></div>
    <label class="vf-file-label" for="veriforensic-certificate-file">
      Download the attachment, then select it
    </label>
    <input
      id="veriforensic-certificate-file"
      class="vf-file-input"
      type="file"
      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    >
    <button type="button" class="vf-certificate-button">Verify certificate</button>
    <div class="vf-result" aria-live="polite"></div>
  `;
  panel.querySelector(".vf-verify-button").addEventListener("click", verifyCurrentMessage);
  panel.querySelector(".vf-certificate-button").addEventListener("click", verifyCertificate);
  document.body.appendChild(panel);
  return panel;
}

function setResult(title, detail = "", state = "") {
  const result = ensurePanel().querySelector(".vf-result");
  result.className = `vf-result ${state}`.trim();
  result.textContent = detail ? `${title}\n${detail}` : title;
}

function responseDetail(data) {
  const payload = data?.payload || data?.metadata || {};
  const registry = data?.registry || {};
  return [
    payload.sender ? `Sender: ${payload.sender}` : "",
    (registry.issuer_name || payload.issuer_name)
      ? `Issuer: ${registry.issuer_name || payload.issuer_name}`
      : "",
    registry.title ? `Title: ${registry.title}` : "",
    (data?.registry_status || registry.status)
      ? `Registry: ${data.registry_status || registry.status}`
      : "",
    payload.timestamp ? `Timestamp: ${payload.timestamp}` : "",
    payload.note ? `Note: ${payload.note}` : "",
    data?.message ? `Note: ${data.message}` : "",
    data?.reason ? `Reason: ${data.reason}` : "",
  ].filter(Boolean).join("\n");
}

async function apiRequest(path, payload, type = "veriforensic-request") {
  const { apiBase } = await getSettings();
  return chrome.runtime.sendMessage({
    type,
    url: `${String(apiBase).replace(/\/+$/, "")}${path}`,
    payload,
  });
}

function verificationOutcome(data) {
  const registryStatus = String(
    data?.registry_status || data?.registry?.status || ""
  ).toLowerCase();
  if (["revoked", "expired", "superseded", "not_registered"].includes(registryStatus)) {
    return {
      verified: false,
      title: `Certificate ${registryStatus.replace("_", " ")}`,
    };
  }

  const status = String(data?.status || data?.metadata?.status || "").toLowerCase();
  const verified =
    data?.verified === true ||
    data?.valid === true ||
    ["verified", "active", "ok"].includes(status);
  return {
    verified,
    title: verified ? "Provenance verified" : "Provenance not verified",
  };
}

function responseError(response) {
  return (
    response?.data?.detail?.message ||
    response?.data?.detail ||
    response?.error ||
    `Verification failed (${response?.status || "network error"})`
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const encoded = String(reader.result || "").split(",", 2)[1];
      encoded ? resolve(encoded) : reject(new Error("Could not read the certificate file."));
    };
    reader.onerror = () => reject(reader.error || new Error("Could not read the certificate file."));
    reader.readAsDataURL(file);
  });
}

async function verifyCurrentMessage() {
  const raw = currentMessageText();
  if (!raw) {
    setResult("No open email found", "Open an email and try again.", "unverified");
    return;
  }

  setResult("Verifying...");
  const token = signatureToken(raw);
  const response = token
    ? await apiRequest("/api/v1/ns-stego/verify-signature", { token })
    : await apiRequest("/api/v1/ns-stego/verify-email", { raw });

  if (!response?.ok) {
    setResult("Unable to verify", String(responseError(response)), "unverified");
    return;
  }

  const data = response.data || {};
  const outcome = verificationOutcome(data);
  setResult(
    outcome.title,
    responseDetail(data),
    outcome.verified ? "verified" : "unverified"
  );
}

async function verifyCertificate() {
  const input = ensurePanel().querySelector(".vf-file-input");
  const file = input.files?.[0];
  if (!file) {
    setResult("Choose a certificate", "Select a downloaded PDF or DOCX attachment.", "unverified");
    return;
  }
  if (file.size > MAX_CERTIFICATE_BYTES) {
    setResult("File is too large", "The maximum certificate size is 10 MB.", "unverified");
    return;
  }

  setResult("Verifying certificate...");
  try {
    const response = await apiRequest(
      "/api/v1/ns-stego/verify-certificate",
      {
        name: file.name,
        type: file.type || "application/octet-stream",
        base64: await fileToBase64(file),
      },
      "veriforensic-certificate-request"
    );
    if (!response?.ok) {
      setResult("Unable to verify", String(responseError(response)), "unverified");
      return;
    }

    const data = response.data || {};
    const outcome = verificationOutcome(data);
    setResult(
      outcome.title,
      responseDetail(data),
      outcome.verified ? "verified" : "unverified"
    );
  } catch (error) {
    setResult("Unable to verify", String(error), "unverified");
  }
}

ensurePanel();
new MutationObserver(ensurePanel).observe(document.documentElement, {
  childList: true,
  subtree: true,
});
