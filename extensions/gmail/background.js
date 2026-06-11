chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!["veriforensic-request", "veriforensic-certificate-request"].includes(message?.type)) {
    return;
  }

  const run = async () => {
    try {
      const url = new URL(message.url);
      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Unsupported verifier API protocol");
      }

      const origin = `${url.origin}/*`;
      const allowed = await chrome.permissions.contains({ origins: [origin] });
      if (!allowed) {
        throw new Error(`Verifier API access is not allowed for ${url.origin}`);
      }

      const options = { method: "POST" };
      if (message.type === "veriforensic-certificate-request") {
        const encoded = message.payload?.base64;
        if (!encoded) throw new Error("Certificate file data is missing");

        const binary = atob(encoded);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        const form = new FormData();
        form.append(
          "file",
          new Blob([bytes], {
            type: message.payload.type || "application/octet-stream",
          }),
          message.payload.name || "certificate.bin"
        );
        options.body = form;
      } else {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(message.payload);
      }

      const response = await fetch(url.toString(), options);
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      sendResponse({ ok: response.ok, status: response.status, data, text });
    } catch (error) {
      sendResponse({ ok: false, status: 0, error: String(error) });
    }
  };

  run();
  return true;
});
