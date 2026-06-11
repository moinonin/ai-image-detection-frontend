document.getElementById("verify").addEventListener("click", async () => {
  const result = document.getElementById("result");
  result.textContent = "Verifying...";
  const response = await browser.runtime.sendMessage({ type: "verify-selected" });
  result.textContent = response?.ok
    ? response.verified
      ? "Provenance verified"
      : "Provenance not verified"
    : response?.error || "Unable to verify";
});
